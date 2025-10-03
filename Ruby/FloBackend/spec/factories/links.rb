FactoryBot.define do
  factory :link do
    user_id 1
    source_type 'VTODO'
    destination_type 'FOLDER'
    source_id 'eyJ1aWQiOjY1LCJwYXRoIjoiSU5CT1giLCJ0aXRsZSI6IldvcmtzaG9wIFTGsCB24bqlbiBDViBtaeG7hW4gcGjDrSAtIGLhuqFuIMSRw6MgYmnhur90IGPDoWNoIGzDoG0gbmjDoCB0dXnhu4NuIGThu6VuZyBcInRo4bqjIHRow61uaFwiIG3DrG5oPyJ9'
    source_root_uid { Faker::Crypto.sha1 }
    destination_root_uid { Faker::Crypto.sha1 }
    destination_id { Faker::Number.number(5) }
    created_date { Time.zone.now.to_i }
    updated_date { Time.zone.now.to_i }
  end
end
