<?php

namespace Floware\LIB;

use Sabre\VObject;
use Sabre\DAV\Exception\InvalidResourceType;
/**
 * Utility
 */
class Util {

    /**
     * Added new fields at Monday, May 10 2021
        - Note
        // sequence, (INT)
        // dtstamp, (INT)
        // note_content, (Text)
        // inline_attachments (Array JSON Object)
        - Todo
        // status, (String)
        // organizer, (JSON object)
        // sequence (INT)
        // start (INT)
        // repeat_rule (string)
        // timezone (string)
        // tzcity (string)
        // attendees (Array JSON Object)
        - Event
        // description, (text)
        // organizer, (JSON object)
        // sequence, (INT)
        // tzcity, (string)
        // attendees (Array JSON Object)
     */

    public static $floTable = [
        TLB_NOTE => [
            'DESCRIPTION' => 'description',
            'UID' => 'uid',
            'SUMMARY' => 'summary',
            'X-LCL-STAR' => 'star',
            'DTSTAMP' => 'created_date'
        ],
        TLB_EVENT => [
            'UID' => 'uid',
            'SUMMARY' => 'summary',
            'LOCATION' => 'location',
            'DTSTART' => 'start',
            'DTEND' => 'end',
            'TZID' => 'timezone',
            'VALARM' => 'alert[JSON]',
            'ATTENDEE' => 'mi',
            'RRULE' => 'repeat_rule',
            'X-LCL-COLOR' => 'color',
            'EXDATE' => 'exdates[JSON]',
            'RECURRENCE-ID' => 'recurid',
            'allday',
            'X-FLOWARE-INVITEE-UID' => 'invitee_uid'
        ],
        TLB_TODO => [
            'UID' => 'uid',
            'SUMMARY' => 'summary',
            'LOCATION' => 'location',
            'DUE' => 'due_date',
            'COMPLETED' => 'completed_date',
            'VALARM' => 'alert[JSON]',
            'X-LCL-STASK' => 'stodo',
            'X-LCL-STAR' => 'star',
            'X-LCL-SUBTASKS' => 'subtasks[JSON]',
            'DURATION' => 'duration',
            'DESCRIPTION' => 'description',
            'RECURRENCE-ID' => 'recurid',
            'RRULE' => 'repeat_rule',
            'EXDATE' => 'exdates[JSON]',
            'STATUS' => 'status',
            'ATTENDEE' => 'assigned'
        ]
    ];

    public static function vObjectPhoto(VObject\Document $card){
        
        try {

            if(is_null($card) || is_null($card->PHOTO) || filter_var($card->PHOTO->getValue(), FILTER_VALIDATE_URL)){
                return [null, null];
            }
            $base64 = $card->PHOTO->getRawMimeDirValue();
            $imgdata = self::base64_decode($base64);
            $image_type = self::mime_content_type($imgdata);
            if (!is_null($image_type)){
                return [$image_type, $base64];
            } else {
                return [null, null];
            }
        } catch (\Throwable $e){
            throw new InvalidResourceType($e->getMessage());
        }
    }

    public static function cardDAVUuid($addressBookId, $cardUri, $username){
        return sprintf(CARDDAV_PATTERN, md5($addressBookId.'$'.$cardUri), $username);
    }

    // saver big content base64
    public static function base64_decode($encoded) {
        $decoded = '';
        for ($i = 0; $i < ceil(strlen($encoded) / 256); $i++)
            $decoded = $decoded . base64_decode(substr($encoded, $i * 256, 256));
        return $decoded;
    }

    public static function mime_content_type($filedata) {

        $mime_types = IMAGE_MIME_TYPE;

        if (function_exists('finfo_open')) {

            $finfo = finfo_open();
            $mimetype = finfo_buffer($finfo, $filedata, FILEINFO_MIME_TYPE);
            finfo_close($finfo);
            $mimetype = explode('/',$mimetype); // [image,extend]
            $ext = strtolower(end($mimetype));

            if (array_key_exists($ext, $mime_types)) {
                return $ext;
            }
            return null;
        } else {
            return null;
        }
    }

    public static function convert_datetime($vdata)
    {

        $tzid = null;

        if (method_exists($vdata, 'parameters')) {
            $tzid = $vdata->parameters();
        }

        $date = VObject\DateTimeParser::parse($vdata->getValue());
        $timezone = null;
        if (isset($tzid['TZID']) && isset($vdata->parent)) {
            $timezone = $tzid['TZID']->getValue();
            // remove timezone in vtodo
            if (isset($vdata->parent->name) && $vdata->parent->name !== 'VTODO') {
                $floData['timezone'] = $tzid['TZID']->getValue();
            }
            $tz = new \DateTimeZone($tzid['TZID']->getValue());
            $date = VObject\DateTimeParser::parse($vdata->getValue(), $tz);
            return [$date->getTimestamp(), $timezone];
        }

        return [$date->getTimestamp(), $timezone];
    }

    private static function mapKey(string $component, string $key)
    {
        // default is trashed, make sure will be override before install to database
        return isset(self::$floTable[$component][$key]) ?self::$floTable[$component][$key] : null;
    }

    /**
     * @description SabreDav vobject transform to Flo data type
     */
    public static function flo_prepare_data($vobject, $component)
    {
        $floData = [];
        $dcomponent = isset(self::$floTable[$component]) ? self::$floTable[$component] : [];
        // set all default is null
        foreach ($dcomponent as $cdata) {
            /**
             * Set default value
             */
            $floData[$cdata] = null;  
        }

        foreach ($vobject->children() as $vdata) {
            $name = self::mapKey($component, $vdata->name);
            if (is_null($name)) {
                continue;
            }
            $floData = self::convert_special_case($floData, $name, $vdata, $component);
        }

        return $floData;
    }

    public static function flo_prepare_statements($floData, $component){
        foreach ($floData as $k => $v) {
            if (!in_array($k, self::$floTable[$component])) {
                unset($floData[$k]);
            }
        }
        return $floData;
    }

    // convert special case data type
    private static function convert_special_case($floData, string $k, $vdata, $component)
    {

        switch ($k) {
            case 'x-lcl-notecontent':
                $floData['description'] = Util::base64_decode($vdata->getValue());
                unset($floData[$k]);
                break;
            case 'alert[JSON]':
                try {
                    $valarm = $vdata->TRIGGER->getValue();
                    if ($valarm == 'P') {
                        $valarm = 'PT0S';
                    }
                    // parse return interval date
                    $interval = VObject\DateTimeParser::parse($valarm);
                    $weeks = 0; // floor($interval->d / 7);
                    $days = 0; //$interval->d % 7;
                    if ($interval->d > 0) {
                        $weeks = floor($interval->d / 7);
                        $days = $interval->d % 7;
                    }

                    // calculator
                    if ($vdata->parent->name === 'VTODO' && $vdata->parent->DUE) {
                        list($dueDate) = self::convert_datetime($vdata->parent->DUE);
                    } else {
                        $dueDate = 0;
                    }


                    $durDate = (new \DateTime())->setTimeStamp(0)->add($interval)->getTimeStamp();

                    $desc = !is_null($vdata->DESCRIPTION) ? $vdata->DESCRIPTION->getValue() : null;
                    $action = !is_null($vdata->ACTION) ? $vdata->ACTION->getValue() : null;
                    $sumary = !is_null($vdata->SUMMARY) ? $vdata->SUMMARY->getValue() : null;

                    $floData[$k][] = [
                        'action' => $action,
                        'description' => $desc,
                        'summary' => $sumary,
                        'trigger' => [
                            'past' => filter_var($interval->invert, FILTER_VALIDATE_BOOLEAN),
                            'weeks' => $weeks,
                            'days' => $days,
                            'hours' => $interval->h,
                            'minutes' => $interval->i,
                            'seconds' => $interval->s,
                            'time' => (int) ($dueDate - abs($durDate))
                        ]
                    ];
                } catch (\Throwable $th) {
                    $floData[$k] = null;
                }
                break;
            case 'subtasks[JSON]':
                $floData[$k] = Util::base64_decode($vdata->getValue());
                break;
            case 'exdates[JSON]':
                // convert datetime string to unix
                $date = VObject\DateTimeParser::parse($vdata->getValue());
                $floData[$k][] = sprintf("%.3f", $date->getTimestamp());
                break;
            // because it's have invited
            case 'assigned': // attendee on todo as assign feature
            case 'mi':  // attendee on event
                $floData[$k] = true;
                break;
            case 'start':
            case 'end':
            case 'due_date':
            case 'recurid':
            case 'completed_date':
                list($timestamp, $tz) = self::convert_datetime($vdata);
                $floData[$k] = $timestamp;
                $floData['timezone'] = $tz;
                break;
            case 'created_date':
                $date = VObject\DateTimeParser::parse($vdata->getValue());
                $floData[$k] = $date->getTimestamp();
                break;
            case 'star':
            case 'stodo':
                $floData[$k] = filter_var($vdata->getValue(), FILTER_VALIDATE_BOOLEAN);
                break;
            case 'duration':
                $timeInterval = VObject\DateTimeParser::parse($vdata->getValue());
                // convert to mins
                $floData[$k] = (new \DateTime())->setTimeStamp(0)->add($timeInterval)->getTimeStamp();;
                break;
            default:
                $floData[$k] = $vdata->getValue();
        }

        return $floData;
    }

    // check all day event
    public static function is_all_day($dtstart)
    {
        if(is_int($dtstart)){
            $dtstart = date('Ymd\THis',$dtstart);
        }
        $sdate = VObject\DateTimeParser::parse($dtstart);
        $dateTime = new \DateTime(null || null, $sdate->getTimezone());
        $dateTime->setTimestamp($sdate->getTimestamp());
        if (
            (int)$dateTime->format('H') !== 0 ||
            (int)$dateTime->format('i') !== 0 ||
            (int)$dateTime->format('s') !== 0
        ) {
            return false;
        }
        return true;
    }

    // Flo Todo reset values 
    public static function flo_prepare_vtodo($fwdata = array()){
        // progress special field

        if (!isset($fwdata['stodo'])) {
            $fwdata['stodo'] = false;
        }
        // uncheck done
        if (!isset($fwdata['completed_date'])) {
            $fwdata['completed_date'] = null;
        }
        // when non set due date
        if (!isset($fwdata['due_date'])) {
            $fwdata['due_date'] = null;
        }
        // starred
        if (!isset($fwdata['star'])) {
            $fwdata['star'] = false;
        }
        // when delete description
        if (!isset($fwdata['description'])) {
            $fwdata['description'] = null;
        }
        // duration is none
        if (!isset($fwdata['duration'])) {
            $fwdata['duration'] = 0;
        }
        // location is none
        if (!isset($fwdata['location'])) {
            $fwdata['location'] = null;
        }
        // subtasks is none
        if (!isset($fwdata['subtasks[JSON]'])) {
            $fwdata['subtasks[JSON]'] = null;
        }
        // summary is none
        if (!isset($fwdata['summary'])) {
            $fwdata['summary'] = null;
        }
        // alert is none
        if (!isset($fwdata['alert[JSON]'])) {
            $fwdata['alert[JSON]'] = null;
        }

        if (!isset($fwdata['timezone'])) {
            unset($fwdata['timezone']);
        }

        $fwdata = self::flo_prepare_statements($fwdata, TLB_TODO);
       
        return $fwdata;
    }

    /**
     * VTODO
     */
    public static function flo_rrule_vtodo(VObject\Component $vObject)
    {
        $componentType = $vObject->name;
        $component = $vObject;
        $firstOccurence = null;
        $lastOccurence = null;
      
        if (!$componentType) {
            throw new \Sabre\DAV\Exception\BadRequest('Calendar objects must have a VJOURNAL, VEVENT or VTODO component');
        }
        if ('VEVENT' === $componentType) {
            $firstOccurence = $component->DTSTART->getDateTime()->getTimeStamp();
            // Finding the last occurence is a bit harder
            if (!isset($component->RRULE)) {
                if (isset($component->DTEND)) {
                    $lastOccurence = $component->DTEND->getDateTime()->getTimeStamp();
                } elseif (isset($component->DURATION)) {
                    $endDate = clone $component->DTSTART->getDateTime();
                    $endDate = $endDate->add(VObject\DateTimeParser::parse($component->DURATION->getValue()));
                    $lastOccurence = $endDate->getTimeStamp();
                } elseif (!$component->DTSTART->hasTime()) {
                    $endDate = clone $component->DTSTART->getDateTime();
                    $endDate = $endDate->modify('+1 day');
                    $lastOccurence = $endDate->getTimeStamp();
                } else {
                    $lastOccurence = $firstOccurence;
                }
            } else {
                $it = new VObject\Recur\EventIterator($vObject, (string) $component->UID);
                $maxDate = new \DateTime(\Sabre\CalDAV\Backend\PDO::MAX_DATE);
                if ($it->isInfinite()) {
                    $lastOccurence = $maxDate->getTimeStamp();
                } else {
                    $end = $it->getDtEnd();
                    while ($it->valid() && $end < $maxDate) {
                        $end = $it->getDtEnd();
                        $it->next();
                    }
                    $lastOccurence = $end->getTimeStamp();
                }
            }

            // Ensure Occurence values are positive
            if ($firstOccurence < 0) {
                $firstOccurence = 0;
            }
            if ($lastOccurence < 0) {
                $lastOccurence = 0;
            }
        }

        // Destroy circular references to PHP will GC the object.
        $vObject->destroy();

        return [
            'firstOccurence' => $firstOccurence,
            'lastOccurence' => $lastOccurence
        ];
    }

    /**
     * Generate vobject Repeating Todos, temporary call is RTODO
     */
    public static function generate_vobject_rtodo(VObject\Component\VTodo $vobject){
        
        $calendar = new VObject\Component\VCalendar();
        $vevent = $calendar->createComponent('VEVENT');
        $calendar->add($vevent);
        $vevent->remove('UID');
        $uid = $calendar->createProperty('UID', $vobject->{'UID'});
        $vevent->add($uid);
        // logic RTODO so DUE = DTSTART 
        if (isset($vobject->{'DUE'})) {
            $vdatetime = $vobject->{'DUE'}->getValue();
            $dueDate = $calendar->createProperty('DUE');
            $dtstart = $calendar->createProperty('DTSTART');
            $tzid = null;
            if(isset($vobject->{'TZID'})){
                $tzid = new \DateTimeZone($vobject->{'TZID'}->getValue());
            }
            $vdatetime = VObject\DateTimeParser::parse($vdatetime, $tzid);
            $dueDate->setDateTime($vdatetime);
            $dtstart->setDateTime($vdatetime);
            $vevent->add($dtstart);
            $vevent->add($dueDate);
        }

        if (isset($vobject->{'RRULE'})) {
            $rrule = $calendar->createProperty('RRULE', $vobject->{'RRULE'}->getValue());
            $vevent->add($rrule);
        }
        return $vevent;
    }
}
