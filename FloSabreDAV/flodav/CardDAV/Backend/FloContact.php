<?php

namespace Floware\CardDAV\Backend;

use Sabre\VObject;
use Medoo\Medoo;

class FloContact {


    /**
     * PDO connection
     *
     * @var PDO
     */
    protected $pdo;

    /**
     * Sets up the object
     *
     * @param \PDO $pdo
     */
    function __construct(\PDO $pdo) {
        try{
            $this->pdo = new Medoo([
                'pdo' => $pdo,
                'database_type' => 'mysql',
                'charset' => 'utf8mb4',
	            'collation' => 'utf8mb4_general_ci'
            ]);
        } catch(\Throwable $e){
            throw new $e->getMessage();
        }
    }


    private function __server(){
        return $GLOBALS['server'];
    }

    protected $columnsMaps = [
        'UID' => 'uid',
        'N' =>  'N',
        'first_name' => 'first_name',
        'last_name' => 'last_name',
        'middle_name' => 'midle_name',
        // 'FN' => 'first_name',
        'EMAIL' => 'email_address[JSON]',
        'ORG' => 'company',
        'TEL' => 'phone[JSON]',
        'X-VOICECALL' => 'skype_call[JSON]',
        'X-TEXTCHAT' => 'skype_chat[JSON]',
        'X-LCL-VIP' => 'vip',
        'X-ADDRESSBOOKSERVER-KIND' => 'is_group',
        'PHOTO' => 'contact_avatar',
        'TITLE' => 'title'
    ];

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
     * @param VObject\Document $cardData
     * @return string|null
     */
    public function create(VObject\Document $cardData, $addressBookId, $cardUri) {

        try{

            $fwdata = $this->prepairVcard($cardData);
            $fwdata['vip'] = isset($fwdata['vip']) ? filter_var($fwdata['vip'], FILTER_VALIDATE_BOOLEAN) : false;
            $fwdata['addressbookid'] = (int) $addressBookId;
            $fwdata['uri'] = $cardUri;
            $fwdata['trashed'] = FALSE;
            // to save resource
            $cardData->destroy();
            return $this->pdo->insert(TLB_CARD, $fwdata);

        } catch(\Throwable $e){

        }
    }

    /**
     * Update a card.
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
     * @param VObject\Document $cardData
     * @return string|null
     */
    public function updated(VObject\Document $cardData, $addressBookId, $cardUri) {

        try{
            $fwdata = $this->prepairVcard($cardData);
            $fwdata['vip'] = isset($fwdata['vip']) ? filter_var($fwdata['vip'], FILTER_VALIDATE_BOOLEAN) : false;
            // fix bug duplicate unique UUID-AddressID
            unset($fwdata['uid']);
            // to save resource
            $cardData->destroy();
            return $this->pdo->update(TLB_CARD, $fwdata,[
                'addressbookid' => (int) $addressBookId,
                'uri' => $cardUri
            ]);

        } catch(\Throwable $e){

        }
    }

    /**
     * Delete a card.
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
     * @return string|null
     */

    public function delete($addressBookId, $cardUri){
        try{

            return $this->pdo->delete(TLB_CARD,[
                'addressbookid' => $addressBookId,
                'uri' => $cardUri
            ]);

        } catch(\Throwable $e){

        }
    }

    private function mapKey(string $key) {
        // default is trashed, make sure will be override before install to database
        return isset($this->columnsMaps[$key]) ? $this->columnsMaps[$key]: null;
    }

    // convert special type is bool
    private function convertType($obj){

        $xobj = strtolower($obj);

        switch ($xobj) {
            case 'true':
                return true;
                break;
            case 'false':
                return false;
                break;
            default:
                return $obj;
        }
    }

    private function convertSpecialCase(&$fwdata ,$k ){

        switch ($k) {
            case 'n':
            case 'N':
                // explode return 3, array_pad overide if undefined index
                list($last,$first,$mid) = array_pad(explode(';',$fwdata[$k], 3), 3, null);
                $fwdata = array_merge($fwdata,
                    ['first_name' => str_replace(';', '', $first),
                     'midle_name' => str_replace(';', '', $mid),
                     'last_name' =>  str_replace(';','', $last)
                ]);
                // unset N key
                unset($fwdata[$k]);
            break;
            case 'is_group':
                $fwdata[$k] = true;
                break;
            default:
                break;
        }

        return $fwdata;
    }

    private function prepairVcard(VObject\Document $cardData){
        try{
            $fwdata = [];
            // set all default is null
            foreach($this->columnsMaps as $cdata){
                $fwdata[$cdata] = null;
            }
            foreach ($cardData->children() as $vdata) {
                $name = $this->mapKey($vdata->name);
                $params = $vdata->parameters();

                if(is_null($name)){
                    continue;
                }

                if(count($params) > 0 && $name != 'contact_avatar'){
                    $pramType = $params['TYPE']->getValue();
                    $meta['type'] = explode($vdata->delimiter, $pramType);

                    if(isset($params['X-SERVICE-TYPE'])){
                        $meta['x-service-type'] = explode($vdata->delimiter, $params['X-SERVICE-TYPE']->getValue());
                    }

                    $fwdata[$name][] = array(
                        'meta' =>  $meta,
                        'value' => $this->convertType($vdata->getValue())
                    );
                } else {
                    $fwdata[$name] = $this->convertType($vdata->getValue());
                }
                // convert last step spical case
                $fwdata = $this->convertSpecialCase($fwdata, $name);
            }
            // special delete case
            unset($fwdata['N']);
            return $fwdata;
        } catch(\Throwable $e){

        }
    }

}
