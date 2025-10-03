<?php

namespace Floware\LIB;

class SignatureOtr {
    protected $email;
    protected $url;
    protected $app_secret;

    function __construct($email, $url) {
        $this->email = $email;
        $this->url = $url;
        $this->app_secret = getenv("APP_SECRET") ? getenv("APP_SECRET") : 'd5bc04294e8b80cb485e481eef617041';
    }

    private function RemoveSignatureOtr() {
        list($domain, $query_string) = explode('?', $this->url);
        parse_str($query_string, $query);
        unset($query['otr']);
        unset($query['signature']);
        return $domain . '?' .http_build_query($query);
    }

    function Otr() {
        $milliseconds = round(microtime(true) * 1000);
        $md5_email = md5($this->email); 
        $rand_string = rand(10, 9999);
        return $md5_email .'-'. $milliseconds .'-'. $rand_string;
    }
    function Signature($otr) {
        $this->url = $this->RemoveSignatureOtr();
        $str = $this->url.$otr.$this->app_secret;
        $sig = md5($str);
        return $sig;
    }
    function GenaralUrl() {
        $otr = $this->Otr();
        $sig = $this->Signature($otr);
        $full_url = $this->url . '&otr=' . $otr . '&signature=' . $sig;
        return $full_url;
    }
}