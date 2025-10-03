<?php

namespace Floware\DAV\Log;

use Sabre\DAV\Server;
use Sabre\DAV\ServerPlugin;
use Sabre\HTTP\RequestInterface;
use Sabre\HTTP\ResponseInterface;
use Sabre\DAV\Exception\NotAuthenticated;

use Floware\LIB\Graylog as libGraylog;

class Graylog extends ServerPlugin {
    protected $server;
    protected $functionName;

    function __construct($functionName) {
        $this->functionName = $functionName;
    }

    function getPluginName() {

        return 'Graylog';

    }

    function initialize(Server $server){
        $server->on('afterMethod', [$this, 'SendLog'], 100);
        $server->on('exception', [$this, 'SendLogException'], 100);
        $this->server = $server;
    }


    function SendLog(RequestInterface $request, ResponseInterface $response) {
        try {
            $method = $request->getMethod();
            $responseBody = $response->getBodyAsString();
            $requestBody = file_get_contents('php://input');
            if ($method === 'PUT') {
                $requestBody = $request->getBodyAsString();
            }
            $url = $request->getAbsoluteUrl();
            $httpStatus = $response->getStatus();
            $request->removeHeader('Authorization');
            $requestHeaders = $request->getHeaders();
            $responseHeaders = $response->getHeaders();

            $headers = [
                'method' => $method,
                'url' => $url,
                'httpStatus' => $httpStatus,
                'requestHeaders' => $requestHeaders,
                'responseHeader' => $responseHeaders,
            ];
            $graylog = new libGraylog($this->functionName);
            $graylog->SendLog($requestBody, $responseBody, $headers);
            $response->setBody($responseBody);
            return true;
        } catch (\Throwable $e) {
        }
    }

    function SendLogException (\Throwable $exception) {
        try {

            // skip if not found authorization in header
            if($exception instanceof NotAuthenticated){
                return true;
            }

            $file = $exception->getFile();
            $trace = $exception->getTrace();
            $function = $trace[0]['function'];
            $class = $trace[0]['class'];
            
            $request = $this->server->httpRequest; 
            $method = $request->getMethod();
            $requestBody = file_get_contents('php://input');
            if ($method === 'PUT' || $method === 'POST') {
                $requestBody = $request->getBodyAsString();
            }
            $responseBody = $exception->getMessage();
            $headers = [
                'method' => $method,
                'url' => $request->getAbsoluteUrl(),
                'httpStatus' => 500, // crash always resp 500 
                'file' => $file,
                'class' => $class,
                'function' => $function,
                'line' => $exception->getLine(),
                'requestBody' => $requestBody,
                'responseBody' => $responseBody
            ];
            $graylog = new libGraylog($this->functionName);
            $graylog->SendLogException($file, $class, $function, $headers);
            return true;
        } catch (\Throwable $e) {
            throw new \LogicException($e->getMessage());
        }
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
            'description' => 'FloDAV integrate GrayLog',
            'link' => 'https://floware.com/',
        ];
    }

}