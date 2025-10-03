<?php

namespace Floware\DAV\Auth;
use Sabre\DAV\Auth\Plugin as DAVAuth;
use Sabre\Uri;
// Can override method
class Plugin extends  DAVAuth {

    /**
     * Returns the current username.
     *
     * This method is deprecated and is only kept for backwards compatibility
     * purposes. Please switch to getCurrentPrincipal().
     *
     * @deprecated Will be removed in a future version!
     * @return string|null
     */
    function getCurrentUser() {

        // We just do a 'basename' on the principal to give back a sane value
        // here.
        $username = explode('/', $this->getCurrentPrincipal());

        if(count($username) > 0){
            $username = end($username);
        }

        return $username;

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
            'description' => 'FloDAV extends Sabre authentication plugin',
            'link' => 'https://floware.com/',
        ];
    }

}
