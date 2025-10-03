<?php

namespace Floware\LIB;

use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Aws\S3\Exception\S3Exception;
use Sabre\DAV\Exception\BadRequest;

class AmazonS3 implements UploadInterface {
    
    protected $env = [];
    protected $s3;

    function __construct() {
       
    }

    function init(){
        // inital S3 secret
        $this->env = [
            'AWS_S3_SECRET_ACCESS_KEY' => getenv('AWS_S3_SECRET_ACCESS_KEY'),
            'AWS_S3_ACCESS_KEY_ID' => getenv('AWS_S3_ACCESS_KEY_ID'),
            'AWS_S3_ENDPOINT' => getenv('AWS_S3_ENDPOINT'),
            'AWS_S3_REGION' => getenv('AWS_S3_REGION'),
            'AWS_S3_BUCKET' => getenv('AWS_S3_BUCKET'),
        ]; 
        // inital client S3
        try{
            if($this->env['AWS_S3_ACCESS_KEY_ID'] !== false){
                $this->s3 = new S3Client([
                    'region'  => $this->env['AWS_S3_REGION'],
                    'version' => 'latest',
                    'endpoint' => $this->env['AWS_S3_ENDPOINT'],
                    'credentials' => [
                        'key'    => $this->env['AWS_S3_ACCESS_KEY_ID'],
                        'secret' => $this->env['AWS_S3_SECRET_ACCESS_KEY'],
                    ]
                ]);
            }
            return $this;
        } catch (AwsException $e) {
            return $this;
        }
    }

    /**
     * Upload file to AWS S3
     */
    public function putObject($photo, $email, $imagesInfo = []) {

        if(is_null($this->s3) || count($imagesInfo) < 2){
            return null;
        }

        try {

            list($addbook, $name_image) = $imagesInfo;
            
            $result = $this->s3->putObject([
                'Bucket' => $this->env['AWS_S3_BUCKET'],
                'Key'    => sprintf(AVATAR_PATTERN, md5($email), $addbook, $name_image, $name_image),
                'ACL'    => 'public-read',
                'Body' => Util::base64_decode($photo)
            ]);

            if (isset($result['ObjectURL'])) {
                return sprintf(API_PATTERN, md5($email), $addbook, $name_image);
            }
            return null;
        } catch (S3Exception $e) {
           throw new BadRequest($e->getMessage());
        }
    }

    /**
     * Delete a file on AWS S3
     */
    public function deleteObject($email, $imagesInfo = []) {
        if(is_null($this->s3) || count($imagesInfo) < 2){
            return null;
        }
        try{
            
            list($addbook, $name_image) = $imagesInfo;
            $avatarKey = sprintf(AVATAR_PATTERN, md5($email), $addbook, $name_image, $name_image);
            
            return $this->s3->deleteObject([
                'Bucket' => $this->env['AWS_S3_BUCKET'],
                'Key'    => $avatarKey
            ]);
        }catch (S3Exception $e) {
            throw new BadRequest($e->getMessage());
        }
    }
}