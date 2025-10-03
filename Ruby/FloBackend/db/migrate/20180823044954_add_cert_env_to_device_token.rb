class AddCertEnvToDeviceToken < ActiveRecord::Migration[5.0]
  def self.up
    unless column_exists? :device_token, :cert_env
      add_column :device_token, :cert_env, :integer, default: 0
    end
  end

  def self.down
    remove_column :device_token, :cert_env
  end
end
