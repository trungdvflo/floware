<?php

namespace Floware\CalDAV\Backend;
use Floware\DAV\Log\Graylog;
use Sabre\VObject;
use Spatie\Async\Pool;
use Floware\LIB\Util;
use Medoo\Medoo;

class FloVobject {

    /**
     * Hold connection database
     * @var Medoo\Medoo // fix auto dectect class
     */
    protected Medoo $pdo;

    /**
     * hold instance graylog to send exception log.
     * @var Graylog
     */
    protected $graylog;

    function __construct(Medoo $medooPdo) {
        $this->pdo = $medooPdo;
        $this->graylog = (new Graylog(get_class($this)))->getGrayLog();
    }

    static function addLog(\Throwable $e, $data = array())
    {
        $this->graylog->emergency(
            $e->getMessage(),
            array(
                'exception' => $e,
                'additionals' => json_encode($data)
            )
        );
    }

    /**
     * @description handle stodo
     */
    static function scheduleVTODO($vobject, $calendarId, $objectUri, $fwdata){
        // fullfill some field defaul into db
        $fwdata = Util::flo_prepare_vtodo($fwdata);
        $condition = [
            'calendarid' => $calendarId,
            'uri' => $objectUri,
            'uid' => $fwdata['uid']
        ];
        /**
         * Logic STODO, so we have to check Event
         * We update or remove both VTODO and VEVENT object if this ics is STODO type.
         */
        $hasSVTodo = $this->pdo->has(TLB_EVENT, $condition);
        //stodo then update event
        if (isset($fwdata['stodo']) && $fwdata['stodo'] === true) {
            // check exist then update event else create
            if ($hasSVTodo) {
                self::update_vobject('VEVENT', $vobject, $calendarId, $objectUri, $fwdata);
            } else {
                self::create_vobject('VEVENT', $vobject, $calendarId, $objectUri, false, $fwdata);
            }
        } else {
            if ($hasSVTodo) {
                self::delete(TLB_EVENT, [
                    'calendarid' => $calendarId,
                    'uri' => $objectUri
                ]);
            }
        }
    }

    /**
     * @description delete one on 3 tables cal_event, cal_todo, card_contact
     */
    static function delete($tbl, $condition = array())
    {
        // only effect 3 tables cal_
        if (in_array($tbl, [TLB_NOTE, TLB_EVENT, TLB_TODO])) {
            return $this->pdo->delete($tbl, $condition);
        }
    }


    // insert data to floDAV web note
    static function create_note($vobject, $calendarId, $objectUri)
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
            self::addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

    static function create_event($vobject, $calendarId, $objectUri, $validateAllDay = true, $originTodo = null)
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
            self::addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

    static function create_todo($vobject, $calendarId, $objectUri)
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
                self::create_event($vobject, $calendarId, $objectUri, false, $fwdata);
            }
            $fwdata = Util::flo_prepare_statements($fwdata, TLB_TODO);
            $fwdata['calendarid'] = $calendarId;
            $fwdata['uri'] = $objectUri;
            $fwdata['created_date'] = microtime(true);
            $fwdata['updated_date'] = microtime(true);
            $fwdata['trashed'] = FALSE;
            return $this->pdo->insert(TLB_TODO, $fwdata);
        } catch (\Throwable $e) {
            self::addLog($e, array(
                $calendarId, $objectUri,
                $fwdata
            ));
            throw $e;
        }
    }

    static function create_vobject($type, $vobject, $calendarId, $objectUri, $validateAllDay = true, $originTodo = null)
    {
        try {
            switch ($type) {
                case 'VEVENT':
                    self::create_event($vobject, $calendarId, $objectUri, $validateAllDay, $originTodo);
                    break;
                case 'VTODO':
                    self::create_todo($vobject, $calendarId, $objectUri);
                    break;
                case 'VJOURNAL':
                    self::create_note($vobject, $calendarId, $objectUri);
                    break;
                default:
                    break;
            }
        } catch (\Throwable $e) {
            self::addLog($e, array(
                $calendarId, $objectUri,
                $vobject
            ));
        }
    }


    public function update_vobject($type, $vobject, $calendarId, $objectUri, $originTodo = null)
    {
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
                    self::scheduleVTODO($vobject, $calendarId, $objectUri, $fwdata);
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
                if($type !== 'VJOURNAL'){
                    $condition['recurid'] = null;
                }
                // repeat todos, if have exdates we must delete there. 
                if(isset($fwdata['exdates[JSON]'])){
                    $delCondition['recurid'] = $fwdata['exdates[JSON]'];
                    $this->delete($tableName, $delCondition);
                }
                $this->pdo->update($tableName, $fwdata, $condition);
            } else {
                self::create_vobject($type, $vobject, $calendarId, $objectUri);
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