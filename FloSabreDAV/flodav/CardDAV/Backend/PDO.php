<?php

namespace Floware\CardDAV\Backend;

use Sabre\VObject;
use Sabre\Uri;
use Spatie\Async\Pool;
use Sabre\CardDAV\Backend as SabreCardDAV;
use Sabre\DAV\Exception;
use Sabre\DAV\Exception\BadRequest;

use Floware\LIB\AmazonS3;
use Floware\LIB\Util;
use Floware\LIB\Graylog;
use Floware\LIB\SignatureOtr;
/**
 * Floware PDO CardDAV backend
 *
 * This Floware CardDAV backend uses PDO to store addressbooks
 *
 * @copyright Copyright (C) FLOWARE (https://floware.com/)
 */
class PDO extends SabreCardDAV\PDO implements BackendInterface {

    protected $pdoFOL;
    protected $aws3;

    /**
     * Sets up the object
     *
     * @param \PDO $pdo
     */
    function __construct(\PDO $pdo, \PDO $pdoFOL) {

        $this->pdo = $pdo;
        $this->pdoFOL = $pdoFOL;
        $this->aws3 = new AmazonS3();
    }

    private function __server(){
        return $GLOBALS['server'];
    }

    public function getCurrentUser() {
        $server = $this->__server();

        if(is_null($server)){
            return null;
        }
        $authPlugin = $server->getPlugin('auth');

        if (is_null($authPlugin)){
            return null;
        }
        return $authPlugin->getCurrentUser();
    }

    private function addLog(\Throwable $e){
        try{
            $msg = $this->getCurrentUser() .' avatar upload '.$e->getMessage();
            $graylog = new Graylog(get_class($this));
            $message = $graylog->getInstace();
            $message->setShortMessage($msg)->setFullMessage(new BadRequest($msg));
            $graylog->publish($message);
        }catch(\Throwable $e){
            return null;
        }
    }


    private function cardURI($addressBookId, $cardUri, $card){

        try {
            $obj = parent::getCard($addressBookId, $cardUri);
            if ($obj){
                // if exist then update
                $reconact = new FloContact($this->pdoFOL);
                $reconact->create($card, $addressBookId, $cardUri);
                throw new Exception\Conflict('Contact is existed');
            }

            return $cardUri;
        } catch (Exception\Conflict $e) {
            $this->addLog($e);
            throw new Exception\Conflict($e->getMessage());
        }
    }

    /**
     * Creates a new card.
     *
     * The addressbook id will be passed as the first argument. This is the
     * same id as it is returned from the getAddressBooksForUser method.
     *
     * The cardUri is a base uri, and doesn't include the full path. The
     * cardData argument is the vcard body, and is passed as a string.
     *
     * It is possible to return an ETag from this method. This ETag is for the
     * newly created resource, and must be enclosed with double quotes (that
     * is, the string itself must contain the double quotes).
     *
     * You should only return the ETag if you store the carddata as-is. If a
     * subsequent GET request on the same card does not have the same body,
     * byte-by-byte and you did return an ETag here, clients tend to get
     * confused.
     *
     * If you don't return an ETag, you can just return null.
     *
     * @param mixed $addressBookId
     * @param string $cardUri
     * @param string $cardData
     * @return string|null
     */
    function createCard($addressBookId, $cardUri, $cardData) {
        // parse card to vobject
        $card = VObject\Reader::read($cardData);
        // check card exist or not
        // $cardUri = $this->cardURI($addressBookId, $cardUri, $card);
        // create instance for async task
        $tasks = Pool::create()->concurrency(2);
        // etag by md5 data
        $etag = null;

        // if photo exist

        $tasks[] = async(function () use ($addressBookId, &$card, $cardUri) {
            if (!is_null($card->PHOTO)) {
                // get value
                $url = $card->PHOTO->getValue();
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    return $card;
                } else {

                    list($ext, $base64) = Util::vObjectPhoto($card);
                    if (!is_null($ext)) {
                        // get current user
                        $username = $this->getCurrentUser();

                        $imageInfo = [$addressBookId, $cardUri];

                        $url = $this->aws3->init()->putObject($base64, $username, $imageInfo);
                        if (is_null($url)) {
                            throw new Exception\BadRequest('Error upload to storage service');
                        }
                        unset($card->PHOTO);
                        $card->add('PHOTO', $url.'&tm='.microtime(true), ['TYPE' => 'image/'.$ext, 'VALUE' => 'URI']);
                    }
                }
            }
            return $card;
        })->then(function ($card) use (&$etag,$addressBookId, $cardUri) {
            $etag = parent::createCard($addressBookId, $cardUri, $card->serialize());
        })->catch(function (\Throwable $e) {
            $this->addLog($e);
            throw new Exception\BadRequest($e->getMessage());
        });

        // Forward to FLO
        $tasks[] = async(function () {
            // instance contact
            return new FloContact($this->pdoFOL);
        })->then(function ($contact) use (&$etag, $card, $addressBookId, $cardUri) {
            if(!is_null($etag)){
                // create new contact in to Flo Web Contact
                $contact->create($card, $addressBookId, $cardUri);
            }
        })->catch(function (\Throwable $e) {
            $this->addLog($e);
            throw new Exception\NotImplemented($e->getMessage());
        });

        await($tasks);

        return $etag;
    }

    /**
     * Updates a card.
     *
     * The addressbook id will be passed as the first argument. This is the
     * same id as it is returned from the getAddressBooksForUser method.
     *
     * The cardUri is a base uri, and doesn't include the full path. The
     * cardData argument is the vcard body, and is passed as a string.
     *
     * It is possible to return an ETag from this method. This ETag should
     * match that of the updated resource, and must be enclosed with double
     * quotes (that is: the string itself must contain the actual quotes).
     *
     * You should only return the ETag if you store the carddata as-is. If a
     * subsequent GET request on the same card does not have the same body,
     * byte-by-byte and you did return an ETag here, clients tend to get
     * confused.
     *
     * If you don't return an ETag, you can just return null.
     *
     * @param mixed $addressBookId
     * @param string $cardUri
     * @param string $cardData
     * @return string|null
     */
    function updateCard($addressBookId, $cardUri, $cardData) {
        // parse card to vobject
        $card = VObject\Reader::read($cardData);
        // get current user
        $username = $this->getCurrentUser();

        $hasPhoto = !is_null($card->PHOTO)? true: false;
        // create instance for async task
        $tasks = Pool::create()->concurrency(2);

        // etag by md5 data
        $etag = null;
        // remove spacewhite
        $cardUri = trim($cardUri);

        // if photo in contact
        if($hasPhoto){

            $tasks[] = async(function () use ($addressBookId, &$card, $cardUri, $username) {
                // get value
                $url = $card->PHOTO->getValue();

                // if it url not base64
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $photo = $card->PHOTO->parameters();
                    $ext = $photo['TYPE']->getValue();
                    return [$url, str_replace('image/', '' ,$ext)];
                }

                list($ext, $base64) = Util::vObjectPhoto($card);
                if(is_null($ext)){
                    return [null,null];
                }
                // get current user
                $username = $this->getCurrentUser();
                $imageInfo = [$addressBookId, $cardUri , $ext];
                $url = $this->aws3->init()->putObject($base64, $username, $imageInfo);

                if (is_null($url)) {
                    throw new Exception\BadRequest('Error upload to storage service');
                }
                return [$url, $ext];
            })->then(function ($result) use (&$card, $addressBookId, $cardUri, &$etag)  {

                list($url, $ext) = $result;
                if(is_null($url)){
                    return null;
                }
                unset($card->PHOTO);
                $card->add('PHOTO', $url.'&tm='.microtime(true), ['TYPE' => 'image/'.$ext, 'VALUE' => 'URI']);
                $etag = parent::updateCard($addressBookId, $cardUri, $card->serialize());
            })->catch(function (\Throwable $e) {
                $this->addLog($e);
            });
        } else{
            // updated card
            $tasks[] = async(function () use ($cardData, $addressBookId, $cardUri){
                return parent::updateCard($addressBookId, $cardUri, $cardData);
            })->then(function ($md5) use(&$etag) {
                $etag = $md5;
            })->catch(function (\Throwable $e) {
                $this->addLog($e);
            });
        }

        // Forward to FLO
        $tasks[] = async(function () {
            // instance contact
            return new FloContact($this->pdoFOL);
        })->then(function ($contact) use (&$etag, $card, $addressBookId, $cardUri) {
            if(!is_null($etag)){
                // create new contact in to Flo Web Contact
                $contact->updated($card, $addressBookId, $cardUri);
            }
        })->catch(function (\Throwable $e) {
            $this->addLog($e);
            throw new Exception\NotImplemented($e->getMessage());
        });

        // wait done
        await($tasks);

        return $etag;
    }

    /**
     * Deletes a card
     *
     * @param mixed $addressBookId
     * @param string $cardUri
     * @return bool
     */
    function deleteCard($addressBookId, $cardUri) {
        $etag = null;
        // create instance for async task
        $tasks = Pool::create()->concurrency(3);

        $tasks[] = async(function () use ($addressBookId, $cardUri){
            return parent::deleteCard($addressBookId, $cardUri);
        })->then(function ($md5) use(&$etag) {
            $etag = $md5;
        })->catch(function (\Throwable $e) {
            $this->addLog($e);
        });

        // delete file if exist
        $tasks[] = async(function (){
            return $this->aws3->init();
        })->then(function ($aws3) use($addressBookId, $cardUri) {
            $username = $this->getCurrentUser();
            $imageInfo = [$addressBookId, $cardUri];
            $aws3->deleteObject($username, $imageInfo);
        })->catch(function (\Throwable $e) {
            $this->addLog($e);
        });

        // Forward to FLO Web
        $tasks[] = async(function () {
            // instance contact
            return new FloContact($this->pdoFOL);
        })->then(function ($contact) use ($addressBookId, $cardUri) {
            // create new contact in to Flo Web Contact
            $contact->delete($addressBookId, $cardUri);
        })->catch(function (\Throwable $e) {
            $this->addLog($e);
            throw new Exception\NotImplemented($e->getMessage());
        });

        // wait done
        await($tasks);

        return $etag;
    }

    /**
     * Returns a specfic card.
     *
     * The same set of properties must be returned as with getCards. The only
     * exception is that 'carddata' is absolutely required.
     *
     * If the card does not exist, you must return false.
     *
     * @param mixed $addressBookId
     * @param string $cardUri
     * @return array
     */
    function getCard($addressBookId, $cardUri) {
        // remove query string namecard&q=x
        // $cardUri = strtok($cardUri, '&');
        $result = parent::getCard($addressBookId, $cardUri);
        if(!$result){
            return $result;
        }
        $card = VObject\Reader::read($result['carddata']);

        if(!is_null($card->PHOTO) && $card->PHOTO->getValueType() == URI_TYPE) {

            // get value
            $url = $card->PHOTO->getValue();
            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                // replace old
                $url = str_replace(API_DOMAIN_NAME,'', $url);
                // url for user
                $url = API_DOMAIN_NAME.'/'.$url;

                $ext = 'image/jpeg';
                if(!is_null($card->PHOTO['TYPE'])){
                    $ext = $card->PHOTO['TYPE']->getValue();
                }
                unset($card->PHOTO);
                // replace uri
                $card->add('PHOTO', $url, ['TYPE' => $ext, 'VALUE' => URI_TYPE]);
                // reassign to carddata
                $result['carddata'] = $card->serialize();
            }

        }

        return $result;

    }


    /**
     * Returns a list of cards.
     *
     * This method should work identical to getCard, but instead return all the
     * cards in the list as an array.
     *
     * If the backend supports this, it may allow for some speed-ups.
     *
     * @param mixed $addressBookId
     * @param array $uris
     * @return array
     */
    function getMultipleCards($addressBookId, array $uris) {

        // get multiple card by sabredav
        $result = parent::getMultipleCards($addressBookId, $uris);

        // logic floDav
        foreach($result as $rk => $row) {

            $card = VObject\Reader::read($row['carddata']);

            if(!is_null($card->PHOTO) && $card->PHOTO->getValueType() == URI_TYPE) {

                // get value
                $url = $card->PHOTO->getValue();
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    // replace old
                    $url = str_replace(API_DOMAIN_NAME,'', $url);
                    // url for user
                    $url = API_DOMAIN_NAME.'/'.$url;

                    $ext = 'image/jpeg';
                    if(!is_null($card->PHOTO['TYPE'])){
                        $ext = $card->PHOTO['TYPE']->getValue();
                    }
                    unset($card->PHOTO);
                    // replace uri
                    $card->add('PHOTO', $url, ['TYPE' => $ext, 'VALUE' => URI_TYPE]);
                    // reassign to carddata
                    $result[$rk]['carddata'] = $card->serialize();
                }

            }
        }

        return $result;

    }

}
