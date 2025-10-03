module Environment
  def self.pems
    {
      # floInter_Prod: pems_path + '/ProductPush_180524.pem',
      # floInter_Dev: pems_path + '/DevelopPush_180725.pem',
      # floQC_Prod: pems_path + '/181129_com.floware.flo.qc_push_production.pem',

      # floQC_Dev: pems_path + '/181129_com.floware.flo.qc_push_development.pem',
      # floDev_Prod: pems_path + '/181130_com.floware.flo.dev_push_production.pem',
      # floDev_Dev: pems_path + '/181130_com.floware.flo.dev_push_development.pem',

      # ipad_dev: pems_path + '/FloUniversal_123flo_APNS.pem',
      # ipad_beta: pems_path + '/FloUniversal_Flomail.Net_APNS.pem'

      # device_type + cert_env
      floInter_Prod: pems_path + '/00.pem',
      floInter_Dev: pems_path + '/01.pem',

      floQC_Prod: pems_path + '/30.pem',
      floQC_Dev: pems_path + '/31.pem',

      floDev_Prod: pems_path + '/40.pem',
      floDev_Dev: pems_path + '/41.pem',

      ipad_dev: pems_path + '/10.pem',
      ipad_beta: pems_path + '/20.pem'
    }
  end

  def self.pems_path
    ENV['PEM_DIR'] || File.join(File.dirname(__FILE__), '../pems')
  end

  def self.pem_env
    JSON.parse(ENV['KEY_MAP_PUSH_NOTIFY'] || '{"10":"com.floware.universalflo.qcrelease","40":"com.floware.flo.dev"}')
  end

  def self.database_env
    {
      host: ENV['MYSQL_HOST'] || 'rds-dev-main.flodev.net',
      username: ENV['MYSQL_USERNAME'] || 'nam.nguyen',
      password: ENV['MYSQL_PASSWORD'] || 'y51nAW55xOo8UIkv',
      database: ENV['MYSQL_DATABASE'] || 'flowdata'
    }
  end
end
