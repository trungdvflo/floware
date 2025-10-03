<?php

namespace Floware\CalDAV\Backend;

use Medoo\Medoo;
use Sabre\VObject;
use Spatie\Async\Pool;
use Floware\LIB\Util;
use Floware\LIB\Graylog;


class FloCalendar
{


    /**
     * Hold connection database
     * @var Medoo\Medoo // fix auto dectect class
     */
    protected Medoo $pdo;

    /**
     * hold instance graylog to send exception log.
     */
    protected $graylog;

    /**
     * Sets up the object
     *
     * @param \PDO $pdo
     */
    function __construct(\PDO $pdo)
    {
        try {
            $this->pdo = new Medoo([
                'pdo' => $pdo,
                'database_type' => 'mysql',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_general_ci',
                'logging' => true
            ]);
            $this->graylog = (new Graylog(get_class($this)))->getGrayLog();
        } catch (\Throwable $e) {
            throw new $e->getMessage();
        }
    }

    function addLog(\Throwable $e, $data = array())
    {
        $this->graylog->emergency(
            $e->getMessage(),
            array(
                'exception' => $e,
                'additionals' => json_encode($data)
            )
        );
    }

    // get server plugin
    private function __server()
    {
        return $GLOBALS['server'];
    }

    // insert data to floDAV web note
    public function create_note($vobject, $calendarId, $objectUri)
    {
        try {
            $fwdata = $vobject;
            if($vobject instanceof VObject\Component\VJournal){
                $fwdata = Util::flo_prepare_data($vobject, TLB_NOTE);
            }
            $fwdata = Util::flo_prepare_statements($fwdata, TLB_NOTE);
            $fwdata['calendarid'] = $calendarId;
            $fwdata['uri'] = $objectUri;
            if (!isset($fwdata['created_date'])) {
                $fwdata['created_date'] = microtime(true);
            }
            $fwdata['updated_date'] = microtime(true);
            $fwdata['trashed'] = FALSE;
            return $this->pdo->insert(TLB_NOTE, $fwdata);
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

    public function create_event($vobject, $calendarId, $objectUri, $validateAllDay = true, $originTodo = null)
    {

        try {
            $fwdata = $vobject;
            if($vobject instanceof VObject\Component){
                $fwdata = Util::flo_prepare_data($vobject, TLB_EVENT);
                if ($validateAllDay == true) {
                    $fwdata['allday'] = Util::is_all_day($vobject->{'DTSTART'}->getValue());
                } else {
                    $fwdata['allday'] = false;
                }
            }
            $fwdata = Util::flo_prepare_statements($fwdata, TLB_EVENT);
            $fwdata['calendarid'] = $calendarId;
            $fwdata['uri'] = $objectUri;
            $fwdata['created_date'] = microtime(true);
            $fwdata['updated_date'] = microtime(true);
            $fwdata['trashed'] = FALSE;
            // Generate EVENT end date when creating STODO by start date and duration
            if (empty($fwdata['end']) && !empty($originTodo) && !empty($fwdata['start']) && !empty($originTodo['duration'])) {
                $fwdata['end'] = $fwdata['start'] + $originTodo['duration'];
            }
            return $this->pdo->insert(TLB_EVENT, $fwdata);
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

    public function create_todo($vobject, $calendarId, $objectUri)
    {
        try {
            $fwdata = $vobject;
            if($vobject instanceof VObject\Component\VTodo){
                $fwdata = Util::flo_prepare_data($vobject, TLB_TODO);
            }
            if(isset($fwdata['timezone'])){
                unset($fwdata['timezone']);
            }
            //stodo then add event
            if (isset($fwdata['stodo']) && $fwdata['stodo'] === true) {
                // is it root or child
                $recurid = isset($fwdata['recurid']) ? $fwdata['recurid']: null;
                $this->scheduleVTODO($vobject, $calendarId, $objectUri, $fwdata, [
                    'recurid' => $recurid
                ]);
            }
            $fwdata = Util::flo_prepare_statements($fwdata, TLB_TODO);
            $fwdata['calendarid'] = $calendarId;
            $fwdata['uri'] = $objectUri;
            $fwdata['created_date'] = microtime(true);
            $fwdata['updated_date'] = microtime(true);
            $fwdata['trashed'] = FALSE;
            return $this->pdo->insert(TLB_TODO, $fwdata);
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

    public function create_vobject($type, $vobject, $calendarId, $objectUri, $validateAllDay = true, $originTodo = null)
    {
        try {
            switch ($type) {
                case 'VEVENT':
                    $this->create_event($vobject, $calendarId, $objectUri, $validateAllDay, $originTodo);
                    break;
                case 'VTODO':
                    $this->create_todo($vobject, $calendarId, $objectUri);
                    break;
                case 'VJOURNAL':
                    $this->create_note($vobject, $calendarId, $objectUri);
                    break;
                default:
                    break;
            }
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri,
                $vobject
            ));
        }
    }

    public function update_vobject($type, $vobject, $calendarId, 
        $objectUri, $originTodo = null, $extendCondition = array()) {
        // try catch block in block
        try {
            $tableName = ($type === 'VEVENT') ? TLB_EVENT : (($type === 'VTODO') ? TLB_TODO : TLB_NOTE);
            $fwdata = $vobject;
            if ($vobject instanceof VObject\Component) {
                $fwdata = Util::flo_prepare_data($vobject, $tableName);
            }
            $condition = [
                'calendarid' => $calendarId,
                'uri' => $objectUri,
                'uid' => $fwdata['uid']
            ];

            if(count($extendCondition) > 0){
                $condition = array_merge($extendCondition, $condition);
            }

            // special case
            switch ($type) {
                case 'VEVENT':
                    if (!empty($fwdata['start'])) {
                        // special field
                        $fwdata['allday'] = Util::is_all_day($fwdata['start']);
                    }
                    if (!isset($fwdata['summary'])) {
                        $fwdata['summary'] = null;
                    }
                    if (!isset($fwdata['location'])) {
                        $fwdata['location'] = null;
                    }

                    // update EVENT end date when updating STODO by start date and duration
                    if (!empty($originTodo) && !empty($fwdata['start']) && !empty($originTodo['duration'])) {
                        $fwdata['end'] = $fwdata['start'] + $originTodo['duration'];
                    }

                    break;
                case 'VTODO':
                    $this->scheduleVTODO($vobject, $calendarId, $objectUri, $fwdata);
                    break;
                case 'VJOURNAL':
                    // starred
                    if (!isset($fwdata['star'])) {
                        $fwdata['star'] = false;
                    }
                    // when delete description
                    if (!isset($fwdata['description'])) {
                        $fwdata['description'] = null;
                    }
                    unset($fwdata['timezone']);
                    break;
                default:
                    break;
            }

            if (is_null($tableName)) {
                return null;
            }


            $hasVobject = $this->pdo->has($tableName, $condition);
            $fwdata = Util::flo_prepare_statements($fwdata, $tableName);
            // if not existed then will create
            if ($hasVobject) {
                $fwdata['updated_date'] = microtime(true);
                if($type !== 'VJOURNAL' && !isset($fwdata['recurid'])){
                    $condition['recurid'] = null;
                }
                // repeat todos, if have exdates we must delete there. 
                if(isset($fwdata['exdates[JSON]'])){
                    $delCondition['recurid'] = $fwdata['exdates[JSON]'];
                    $this->delete($tableName, $delCondition);
                }
                $this->pdo->update($tableName, $fwdata, $condition);
            } else {
                $this->create_vobject($type, $vobject, $calendarId, $objectUri);
            }
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

    /**
     * Update vobject data on 3 tables cal_event, cal_todo, card_contact
     */
    private function update($tbl, $vdata, $condition = array())
    {
        // only effect 3 tables cal_
        if (in_array($tbl, [TLB_NOTE, TLB_EVENT, TLB_TODO]) && count($condition) > 0) {
            return $this->pdo->update($tbl, $vdata, $condition);
        }
    }

    /**
     * @description delete many records on 3 tables cal_event, cal_todo, card_contact
     */
    public function deleteAll($calendarId, $objectUri, $condition = array())
    {

        $tables = [TLB_NOTE, TLB_EVENT, TLB_TODO];
        $count = 0;
        $tasks = Pool::create()->concurrency(count($tables));
        $condition =  array_merge($condition, [
            'calendarid' => $calendarId,
            'uri' => $objectUri
        ]);
        foreach ($tables as $tbl) {
            $tasks->add(function () use ($tbl, $condition) {
                return $this->delete($tbl, $condition);
            })->then(function ($data) use (&$count) {
                $count++;
            })->catch(function (\Throwable $e) use ($tbl, $condition) {
                $this->addLog($e, array(
                    $tbl,
                    $condition
                ));
            });
        }

        $tasks->wait();

        return ($count >= 0);
    }

    /**
     * @description delete one on 3 tables cal_event, cal_todo, card_contact
     */
    public function delete($tbl, $condition = array())
    {
        // only effect 3 tables cal_
        if (in_array($tbl, [TLB_NOTE, TLB_EVENT, TLB_TODO])) {
            return $this->pdo->delete($tbl, $condition);
        }
    }

    public function muliple_update($type, VObject\Component $vcals, $calendarId, $objectUri, $operator = 'created')
    {
        switch ($vcals) {
            // VTodo type
            case $vcals instanceof VObject\Component\VTodo:
                $this->vcomponent_todo($vcals, $calendarId, $objectUri);
                break;
            default:
                $tasks = Pool::create()->concurrency(1);
                $tasks[] = async(function () use ($calendarId, $objectUri, $operator){
                    // parse data to vobject
                    if ($operator === 'updated') {
                        return $this->deleteAll($calendarId, $objectUri);
                    }
                    return $operator;
                })->then(function ($operator) use($type, $calendarId, $objectUri, $vcals) {
                    foreach ($vcals as $vdata) {
                        $this->create_vobject($type, $vdata, $calendarId, $objectUri);
                    }
                })->catch(function (\Throwable $e) use ($calendarId, $objectUri) {
                    throw new \Sabre\DAV\Exception\BadRequest($e->getMessage());
                });
                await($tasks);
            break;
        }
    }

    /**
     * VTODO
     */
    private function vcomponent_todo(VObject\Component\VTodo $vcals, $calendarId, $objectUri)
    {

        try {
            $fwdata = [];
            // split where is root and child
            foreach ($vcals as $vdata) {
                $vtodo = Util::flo_prepare_data($vdata, TLB_TODO);
                $vtodo = Util::flo_prepare_vtodo($vtodo);
                $dateStart = $vdata->DTSTART;
                if (isset($vtodo['recurid'])) {
                    $fwdata['todos'][$vtodo['recurid']] = $vtodo;
                    if($dateStart){
                        $dateStart = $dateStart->getDateTime()->getTimeStamp();
                        $fwdata['todos'][$vtodo['recurid']]['start'] = $dateStart;
                        $fwdata['todos'][$vtodo['recurid']]['end'] = $dateStart + $vtodo['duration'];
                    }
                } else {
                    $fwdata['root'] = $vtodo;
                    if($dateStart){
                        $dateStart = $dateStart->getDateTime()->getTimeStamp();
                        $fwdata['root']['start'] = $dateStart;
                        $fwdata['root']['end'] = $dateStart + $vtodo['duration'];
                    }
                }
            }

            // root event
            if (isset($fwdata['root'])) {
                $condition = array(
                    'calendarid' => $calendarId,
                    'uri' => $objectUri,
                    'recurid' => null
                );
                $has = $this->pdo->has(TLB_TODO, $condition);
                $isRRstodo = false;
                if(isset($fwdata['root']['repeat_rule']) && isset($fwdata['root']['stodo']) &&  $fwdata['root']['stodo'] === true){
                    $this->scheduleVTODO($fwdata['root'], $calendarId, $objectUri, $fwdata['root'], [
                        'recurid' => null
                    ]);
                    $isRRstodo = true;
                }

                //stodo then add event
                if (!isset($fwdata['root']['due_date']) && !isset($fwdata['root']['start'])) {
                    // no due_date, no dtstart
                    // also delete rrule if only stodo and no repeat
                    // root repeating todos convert normal todos
                    // check stodo and repeat?
                    if ($has) {
                        // delete all execption events and root
                        $conDel = array(
                            'calendarid' => $calendarId,
                            'uri' => $objectUri,
                            'uid' => $fwdata['root']['uid']
                        );
                        $this->delete(TLB_TODO, $conDel);
                        $this->delete(TLB_EVENT, $conDel);
                    }
                    // create a new normal event 
                    $this->create_todo($fwdata['root'], $calendarId, $objectUri);
                    // close and exit
                    if(!$isRRstodo){
                        exit();
                    }
                } else {
                    if ($has) {
                        $fwdata['root'] = Util::flo_prepare_vtodo($fwdata['root']);
                        $this->update(TLB_TODO, $fwdata['root'], array(
                            'calendarid' => $calendarId,
                            'uri' => $objectUri,
                            'recurid' => null,
                        ));
                    } else {
                        $this->create_todo($fwdata['root'], $calendarId, $objectUri);
                    }
                }
            }
            // exception event
            if (isset($fwdata['todos']) && count($fwdata['todos']) > 0) {
                $condition = array(
                    'calendarid' => $calendarId,
                    'uri' => $objectUri,
                    'recurid[!]' => null
                );
                // delete all child have recurid
                $this->delete(TLB_EVENT, $condition);
                $this->delete(TLB_TODO, $condition);
                foreach ($fwdata['todos'] as $recurid => $vtodox) {
                    $this->create_todo($vtodox, $calendarId, $objectUri);
                }
            }
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }


    /**
     * @description handle stodo
     */
    function scheduleVTODO($vobject, $calendarId, $objectUri, $fwdata, $extendCondition = array()){
        try{
            // fullfill some field defaul into db
            $fwdata = Util::flo_prepare_vtodo($fwdata);
            $condition = [
                'calendarid' => $calendarId,
                'uid' => $fwdata['uid']
            ];
            if(count($extendCondition) > 0){
                $condition = array_merge($extendCondition, $condition);
            }
            /**
             * Logic STODO, so we have to check Event
             * We update or remove both VTODO and VEVENT object if this ics is STODO type.
             */
            $hasSVTodo = $this->pdo->has(TLB_EVENT, $condition);
            //stodo then update event
            if (isset($fwdata['stodo']) && $fwdata['stodo'] === true) {
                // check exist then update event else create
                if ($hasSVTodo) {
                    $this->update_vobject('VEVENT', $vobject, $calendarId, $objectUri, $fwdata, $condition);
                } else {
                    $this->create_vobject('VEVENT', $vobject, $calendarId, $objectUri, false, $fwdata);
                }
            } else {
                if ($hasSVTodo) {
                    $this->delete(TLB_EVENT, [
                        'calendarid' => $calendarId,
                        'uri' => $objectUri
                    ]);
                }
            }
        } catch (\Throwable $e) {
            $this->addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

}
