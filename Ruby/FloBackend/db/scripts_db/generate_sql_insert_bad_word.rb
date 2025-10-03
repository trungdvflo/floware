sql = "INSERT INTO restricted_users VALUES "

File.open('google_bad_word.txt','r').each_with_index do |word, i|
  if i == 0
    sql << "('#{word.strip}', 1)"
  else
    sql << ", ('#{word.strip}', 1)"
  end
end

File.open("restricted_users_data.sql", 'w') { |file| file.write(sql) }
