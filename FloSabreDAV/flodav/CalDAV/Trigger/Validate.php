<?php

namespace Floware\CalDAV\Trigger;

use Sabre\DAV\Server;
use Sabre\DAV\ServerPlugin;
use Sabre\HTTP\RequestInterface;
use Sabre\HTTP\ResponseInterface;
use Floware\LIB\Graylog;

class Validate extends ServerPlugin {
    
    protected $server;

    function getPluginName() {

        return 'FloDAValidate';

    }

    function initialize(Server $server){
        $server->on('beforeMethod:MKCALENDAR', [$this, 'HandleMkCalendar']);
        $this->server = $server;
    }

    function HandleMkCalendar (RequestInterface $request, ResponseInterface $response) {
        $CalendarGraylogPlugin = new Graylog('CalendarServer');
        
        $requestBody = $request->getBodyAsString();
        $requestXml  = $this->server->xml->parse($requestBody);
        $bodyXml = $requestXml->getProperties();

        $headers = [
            'method' => 'MKCALENDAR',
            'url' => $request->getAbsoluteUrl(),
            'httpStatus' => '400',
            'file' => __FILE__,
            'class' => $this->getPluginName(),
            'function' => 'HandleMkCalendar',
            'line' => 0,
            'requestBody' => $requestBody,
            'responseBody' => '',
        ];

        if (isset($bodyXml["{DAV:}displayname"]) === false || strtolower($bodyXml["{DAV:}displayname"]) === 'null' || strtolower($bodyXml["{DAV:}displayname"]) === 'nil') {
            $message = 'Displayname is not NULL';
            $headers['responseBody'] = $message;
            $CalendarGraylogPlugin->LogFunctionError($headers['file'], $headers['class'], $headers['function'], $headers);
            throw new \Sabre\DAV\Exception\BadRequest($message);
        }
        
        if ($bodyXml["{DAV:}displayname"] === '' || $bodyXml["{DAV:}displayname"] === ' ') {
            $message = 'Displayname is not Blank';
            $headers['responseBody'] = $message;
            $CalendarGraylogPlugin->LogFunctionError($headers['file'], $headers['class'], $headers['function'], $headers);
            throw new \Sabre\DAV\Exception\BadRequest($message);
        }
        $request->setBody($requestBody);
        return true;
    }

    /**
     * Returns a bunch of meta-data about the plugin.
     *
     * Providing this information is optional, and is mainly displayed by the
     * Browser plugin.
     *
     * The description key in the returned array may contain html and will not
     * be sanitized.
     *
     * @return array
     */
    public function getPluginInfo()
    {
        return [
            'name' => $this->getPluginName(),
            'description' => 'FloDAV Validate input data before action',
            'link' => 'https://floware.com/',
        ];
    }
}