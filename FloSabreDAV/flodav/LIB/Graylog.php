<?php 

namespace Floware\LIB;

class Graylog {
    protected $logHost;
    protected $logPort;
    protected $publisher;
    protected $projectName = 'FloDAV_v4.1.1';
    protected $functionName; 
    
    function __construct($functionName) {
        $this->logHost = getenv('LOG_HOST');
        $this->logPort = getenv('LOG_PORT');
        $this->functionName = $functionName;

        // We need a transport - UDP via port 12201 is standard.
        $transport = new \Gelf\Transport\UdpTransport($this->logHost, $this->logPort, \Gelf\Transport\UdpTransport::CHUNK_SIZE_LAN);

        $this->publisher = new \Gelf\Publisher();
        $this->publisher->addTransport($transport);
    }

    /**
     * @param request $request
     * @param response $response
     * @param headers $headers [method, url, httpStatus, requestHeaders, responseHeaders]
     */
    function SendLog($request, $response, $headers) {
        $message = new \Gelf\Message();
        $message->setShortMessage($this->functionName .' '. $headers['method'] . ': ' . $headers['url'])
            ->setLevel(\Psr\Log\LogLevel::INFO)
            ->setFullMessage($headers)
            ->setFacility($this->functionName)
            ->setHost($this->projectName)
            ->setAdditional('httpStatus', $headers['httpStatus'])
            ->setAdditional('Request', $request)
            ->setAdditional('Response', $response)
        ;
        $this->publisher->publish($message);
    }



    /**
     * @param request $request
     * @param response $response
     * @param headers $headers [method, url, httpStatus, Class, Function, line, requestBody, responseBody]
     */
    function SendLogException($file, $class, $function, $headers) {
        $message = new \Gelf\Message();
        $message->setShortMessage('[Exception] '. $headers['httpStatus'] . ' ' . $this->functionName .' '. $headers['method'] . ': ' . $headers['url'])
            ->setLevel(\Psr\Log\LogLevel::ERROR)
            ->setFullMessage($headers)
            ->setFacility($this->functionName)
            ->setHost($this->projectName)
            ->setAdditional('httpStatus', $headers['httpStatus'])
            ->setAdditional('File', $file)
            ->setAdditional('Class', $class)
            ->setAdditional('Function', $function)
            ->setAdditional('Line', $headers['line'])
            ->setAdditional('Request', $headers['requestBody'])
            ->setAdditional('Response', $headers['responseBody'])
            ->setAdditional('Exception', 'Exception')
        ;
        $this->publisher->publish($message);
    }

    public function getInstace(){
        $message = new \Gelf\Message();
        $message->setHost($this->projectName)
            ->setLevel(\Psr\Log\LogLevel::ERROR)
            ->setFacility($this->functionName);
        return $message;
    }

    public function publish($message) {
        $this->publisher->publish($message);
    }

    function LogFunctionError($file, $class, $function, $headers) {
        try {
            $this->SendLogException($file, $class, $function, $headers);
        } catch (\Throwable $th) {
            return true;
        }
    }

    public function getGrayLog($namespace = 'FloDAV_v4.1.1'){
        return new \Gelf\Logger($this->publisher, $namespace);
    }
}