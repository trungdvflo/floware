<?php

namespace Floware\DAV\Auth\Backend;

class PDO extends AbstractDigest {

    /**
     * Reference to PDO connection
     *
     * @var \PDO $pdo 
     */
    protected $pdo;

    /**
     * PDO table name we'll be using
     *
     * @var string
     */
    public $tableName = 'user';


    /**
     * Creates the backend object.
     *
     * If the filename argument is passed in, it will parse out the specified file fist.
     *
     * @param PDO $pdo
     */
    function __construct(\PDO $pdo) {

        $this->pdo = $pdo;

    }

    /**
     * Returns the digest hash for a user.
     *
     * @param string $realm
     * @param string $username
     * @return string|null
     */
    function getDigestHash($realm, $username) {
        $stmt = $this->pdo->prepare('SELECT digesta1 FROM ' . $this->tableName . ' WHERE username = ?');
        $stmt->execute([$username]);
        return $stmt->fetchColumn() ?: null;
    }

    /**
     * Returns the a user info.
     *
     * @param string $username
     * @return object | null
     */
    function getUser($username) {

        $stmt = $this->pdo->prepare('SELECT username, email, disabled, digesta1 FROM ' . $this->tableName . ' WHERE username = ?');
        $stmt->execute([$username]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$result) return null;
        return $result;
    }

}
