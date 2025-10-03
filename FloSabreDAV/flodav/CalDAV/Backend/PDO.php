<?php

namespace Floware\CalDAV\Backend;

use Sabre\VObject;
use Spatie\Async\Pool;
use Sabre\CalDAV\Backend;
use Sabre\DAV\Xml\Element\Sharee;

use Medoo\Medoo;
use Floware\LIB\Util;
use Floware\LIB\Graylog;

/**
 * Floware PDO CardDAV backend
 *
 * This Floware CardDAV backend uses PDO to store addressbooks
 *
 * @copyright Copyright (C) FLOWARE (https://floware.com/)
 */
class PDO extends Backend\PDO implements BackendInterface {

    /**
     * Hold connection database
     * @var Medoo\Medoo // fix auto dectect class
     */
    protected Medoo $medoo;

    /**
     * hold instance graylog to send exception log.
     */
    protected $graylog;
    /**
     * Sets up the object
     *
     * @param \PDO $pdo
     */
    function __construct(\PDO $pdo, \PDO $pdoFLO) {

        try{
            $this->pdo = $pdo;
            $this->pdoFLO = $pdoFLO;
            $this->graylog = (new Graylog(get_class($this)))->getGrayLog();
            $this->medoo = new Medoo([
                'pdo' => $pdo,
                'database_type' => 'mysql',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_general_ci',
                'logging' => true
            ]);
        }catch (\Throwable $e) {
            throw new $e->getMessage();
        }
        
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

    private function addLog(\Throwable $e, $data = array()){
        $this->graylog->emergency(
            $e->getMessage(),array(
                'exception' => $e,
                'additionals' => json_encode($data)
            )
        );
    }


    /**
     * Creates a new calendar object.
     *
     * The object uri is only the basename, or filename and not a full path.
     *
     * It is possible return an etag from this function, which will be used in
     * the response to this PUT request. Note that the ETag must be surrounded
     * by double-quotes.
     *
     * However, you should only really return this ETag if you don't mangle the
     * calendar-data. If the result of a subsequent GET to this object is not
     * the exact same as this request body, you should omit the ETag.
     *
     * @param mixed $calendarId
     * @param string $objectUri
     * @param string $calendarData
     * @return string|null
     */
    function createCalendarObject($calendarId, $objectUri, $calendarData) {

        // create instance for async task
        $tasks = Pool::create()->concurrency(2);
        // etag by md5 data
        $etag = null;
        // create vcal
        $tasks[] = async(function () use ($calendarId, $objectUri, $calendarData){
            return parent::createCalendarObject($calendarId, $objectUri, $calendarData);
        })->then(function ($md5) use(&$etag) {
            $etag = $md5;
        })->catch(function (\Throwable $e) use ($calendarId, $objectUri, $calendarData) {
            $this->addLog($e, array(
                $calendarId, $objectUri, $calendarData
            ));
        });

        // progress data to flodav web
        $tasks[] = async(function () use ($calendarData){
            // parse data to vobject
            $vcal = VObject\Reader::read($calendarData);
            $extraData = $this->getDenormalizedData($calendarData);
            return [$vcal, $extraData['componentType']];
        })->then(function ($cals) use($calendarId, $objectUri) {

            list($vcal, $type) = $cals;
            list($calId, $instanceId) = $calendarId;
            $floCalDAV = new FloCalendar($this->pdoFLO);
            if(count($vcal->$type) > 1){
                $floCalDAV->muliple_update($type, $vcal->$type, $calId, $objectUri);
            } else {
                $floCalDAV->create_vobject($type, $vcal->$type, $calId, $objectUri);
            }
            $this->flo_rtodo_calendar_object($calId, $objectUri, $vcal);

        })->catch(function (\Throwable $e) use ($calendarId, $objectUri, $calendarData) {
            $this->addLog($e, array(
                $calendarId, $objectUri, $calendarData
            ));
            throw new \Sabre\DAV\Exception\BadRequest($e->getMessage());
        });

        await($tasks);

        return $etag;

    }


    /**
     * Updates an existing calendarobject, based on it's uri.
     *
     * The object uri is only the basename, or filename and not a full path.
     *
     * It is possible return an etag from this function, which will be used in
     * the response to this PUT request. Note that the ETag must be surrounded
     * by double-quotes.
     *
     * However, you should only really return this ETag if you don't mangle the
     * calendar-data. If the result of a subsequent GET to this object is not
     * the exact same as this request body, you should omit the ETag.
     *
     * @param mixed $calendarId
     * @param string $objectUri
     * @param string $calendarData
     * @return string|null
     */
    function updateCalendarObject($calendarId, $objectUri, $calendarData) {

        // create instance for async task
        $tasks = Pool::create()->concurrency(3);
        // etag by md5 data
        $etag = null;
        // update vcal
        $tasks[] = async(function () use ($calendarId, $objectUri, $calendarData){
            return parent::updateCalendarObject($calendarId, $objectUri, $calendarData);
        })->then(function ($md5) use(&$etag) {
            $etag = $md5;
        })->catch(function (\Throwable $e) use ($calendarId, $objectUri, $calendarData) {
            $this->addLog($e, array(
                $calendarId, $objectUri, $calendarData
            ));
        });

        // progress data to flodav web
        $tasks[] = async(function () use ($calendarData){
            // parse data to vobject
            $vcal = VObject\Reader::read($calendarData);
            $extraData = $this->getDenormalizedData($calendarData);
            return [$vcal, $extraData['componentType']];
        })->then(function ($cals) use($calendarId, $objectUri) {

            list($vcal, $type) = $cals;
            list($calId, $instanceId) = $calendarId;
            $floCalDAV = new FloCalendar($this->pdoFLO);
            if(count($vcal->$type) > 1){
                $floCalDAV->muliple_update($type, $vcal->$type, $calId, $objectUri, 'updated');
            } else {
                $floCalDAV->update_vobject($type, $vcal->$type, $calId, $objectUri);
            }
            $this->flo_rtodo_calendar_object($calId, $objectUri, $vcal);
        })->catch(function (\Throwable $e) use ($calendarId, $objectUri, $calendarData) {
            $this->addLog($e, array(
                $calendarId, $objectUri, $calendarData
            ));
            throw new \Sabre\DAV\Exception\BadRequest($e->getMessage());
        });


        await($tasks);

        return $etag;

    }


    /**
     * Deletes an existing calendar object.
     *
     * The object uri is only the basename, or filename and not a full path.
     *
     * @param string $calendarId
     * @param string $objectUri
     * @return void
     */
    function deleteCalendarObject($calendarId, $objectUri) {
        // create instance for async task
        $tasks = Pool::create()->concurrency(2);
        // etag by md5 data
        $etag = null;
        // delete vcal
        $tasks[] = async(function () use ($calendarId, $objectUri){
            return parent::deleteCalendarObject($calendarId, $objectUri);
        })->then(function () use(&$etag) {
            $etag = true;
        })->catch(function (\Throwable $e) use ($calendarId, $objectUri) {
            $this->addLog($e, array(
                $calendarId, $objectUri
            ));
        });
        // delete in flodav web cal
        $tasks[] = async(function () use ($calendarId, $objectUri){
            $floCalDAV = new FloCalendar($this->pdoFLO);
            return $floCalDAV->deleteAll($calendarId, $objectUri);;
        })->then(function ($md5) use(&$etag) {
            $etag = $md5;
        })->catch(function (\Throwable $e) use ($calendarId, $objectUri) {
            $this->addLog($e, array(
                $calendarId, $objectUri
            ));
        });
    }


    /**
     * Creates a new calendar for a principal.
     *
     * If the creation was a success, an id must be returned that can be used
     * to reference this calendar in other methods, such as updateCalendar.
     *
     * @param string $principalUri
     * @param string $calendarUri
     * @param array $properties
     * @return string
     */
    function createCalendar($principalUri, $calendarUri, array $properties) {
        try{
            parent::createCalendar($principalUri, $calendarUri, $properties);
        }catch(\Throwable $e){
            $this->addLog($e, array(
                $principalUri, $calendarUri, $properties
            ));
            throw new \Sabre\DAV\Exception\BadRequest($e->getMessage());
        }
    }

    /**
     * logic update last,first occurrence for RTODO
     */
    private function flo_rtodo_calendar_object($calendarId, $objectUri, VObject\Component $vobject)
    {
        try{
            // it will get first vobject and assign to $component
            // Should return root rtodo
            $component = null;
            foreach ($vobject->getComponents() as $component) {
                if ('VTIMEZONE' !== $component->name) {
                    break;
                }
            }

            if ($component instanceof VObject\Component\VTodo && $component->{'DUE'}) {
                $vobject = Util::generate_vobject_rtodo($component);
                $extraData = Util::flo_rrule_vtodo($vobject);
                $this->medoo->update($this->calendarObjectTableName, $extraData, [
                    'calendarid' => $calendarId,
                    'uri' => $objectUri
                ]);
            }
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri, $vobject
            ));
        }
    }


    /**
     * Returns the list of people whom a calendar is shared with.
     *
     * Every item in the returned list must be a Sharee object with at
     * least the following properties set:
     *   $href
     *   $shareAccess
     *   $inviteStatus
     *
     * and optionally:
     *   $properties
     *
     * @param mixed $calendarId
     *
     * @return \Sabre\DAV\Xml\Element\Sharee[]
     * @Note: This's customize query to return more uri's sharee.
     * We also use medoo for easy change and maintain in future.
     * Current version v4.1.1
     */
    public function getInvites($calendarId)
    {
        if (!is_array($calendarId)) {
            throw new \InvalidArgumentException('The value passed to getInvites() is expected to be an array with a calendarId and an instanceId');
        }
        list($calendarId, $instanceId) = $calendarId;

        $rows = $this->medoo->select($this->calendarInstancesTableName, [
            'principaluri',
            'access',
            'share_href',
            'share_displayname',
            'share_invitestatus',
            'uri'
        ], [
            'calendarid' => $calendarId
        ]);

        $result = [];
        foreach ($rows as $invitee) {
            $result[] = new Sharee([
                'href' => isset($invitee['share_href']) ? $invitee['share_href'] : \Sabre\HTTP\encodePath($invitee['principaluri']),
                'access' => (int) $invitee['access'],
                'inviteStatus' => (int) $invitee['share_invitestatus'],
                'properties' => !empty($invitee['uri']) ? [
                    '{DAV:}uri' => $invitee['uri']
                ] : [],
                'principal' => $invitee['principaluri']
            ]);
        }

        return $result;
    }

}
