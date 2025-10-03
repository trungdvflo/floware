require "./lib/agcaldav.rb"
require "./lib/carddav.rb"

module AppUtils
	def authenticate_with_sabre_caldav_server(user = nil)
		if !user
			user = User.find_by(email: @email)
		end
		begin
			private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
			password = private_key.private_decrypt(Base64.decode64(user.rsa))

			#authenticate and create new client
			caldav = {
				:url      => FLOL_CALDAV_SERVER_URL, 
				:user     => CGI.escape(user.email),
				:password => password,
				:authtype => 'digest'
			}
			@cal = AgCalDAV::Client.new(:uri => caldav[:url], :user => caldav[:user] , 
						:password => caldav[:password], :authtype => caldav[:authtype])
		rescue
		end
		@cal
	end

	def create_cal(user = nil)
		authenticate_with_sabre_caldav_server(user)
	end

	def check_cal
		if !@cal
			create_cal
		end
	end

	def __create_calobj(uuid, calobj, cal_uri)
	  check_cal
		unless @cal.nil? #fix error don't connect caldav, carddav
	  	@cal.create_calobj_by_ical(uuid, calobj, cal_uri)
		end
	end

	def __delete_calendar_obj(uid, cal_uri, item_type)
		check_cal
		res = @cal.delete_calendar_object(uid, cal_uri)
		if res
			save_delete_item(item_type, uid)
		end
		res
	end

	def __delete_cal(uri)
		check_cal
		@cal.delete_calendar(uri)
	end

	def authenticate_with_google_caldav_server(account)
		user_name = account[:user]
		access_token = account[:access_token]
		begin
		#authenticate and create new client
		caldav = {          
			:url      => 'https://apidata.googleusercontent.com/caldav/v2/'+user_name+'/user/',
			:token     => access_token,
			:authtype => 'bearer'
		}
		@gcal = AgCalDAV::GoogleClient.new(:uri => caldav[:url], :token => caldav[:token], :authtype => caldav[:authtype])
		rescue
		end
	end

	def authenticate_with_yahoo_caldav_server(account)
		username = account[:user]
		pw_rsa = account[:pw]
		if username && pw_rsa
			begin
				private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
				pw = private_key.private_decrypt(Base64.decode64(pw_rsa))
				#authenticate and create new client
				caldav = {      
					:url      => 'https://caldav.calendar.yahoo.com/dav/'+username+'/Calendar/',
					:user     => username,
					:ypw => pw.split('@')[0],
					:authtype => 'basic'        
				}
				@ycal = AgCalDAV::YahooClient.new(:uri => caldav[:url], :user => caldav[:user] , 
													:ypw => caldav[:ypw], :authtype => caldav[:authtype])                                            
			end
		end
	end

	def authenticate_with_icloud_caldav_server(acc)
		user_id = 0
		user_id = @user_id
		username = acc[:user]
		account = SetAccount.find_by(user_id: user_id,
                                 user_caldav: username,
                                 account_type: ICLOUD_ACC_TYPE)
		if account
		begin
			# pass =  Api::Web::Utils.decrypt_rsa(rsa_pass)
			private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
			# password = private_key.private_decrypt(Base64.decode64(account.pass_income)).split('@')[0]
			pw = private_key.private_decrypt(Base64.decode64(account.pass_income))
			port = ''
			if account.port_caldav
			port = ':' + account.port_caldav.to_s
			end
			caldav_url = account.server_caldav.to_s + port.to_s + account.server_path_caldav.to_s
			#authenticate and create new client
			caldav = {
				:url      => caldav_url,
				:user     => account.user_caldav,
				:icloud_user_id => account.icloud_user_id,
				:password => pw[0, pw.rindex('@')],
				:authtype => 'basic'
			}
			@icloud = AgCalDAV::ICloudClient.new(:uri => caldav[:url], :user => caldav[:user] , 
													:password => caldav[:password],
													:icloud_user_id => caldav[:icloud_user_id], 
													:authtype => caldav[:authtype])
		rescue
		end
		end
	end

	def authenticate_with_icloud_carddav_server(acc)
		user_id = 0
		user_id = @user_id
		username = acc[:user]
		account = SetAccount.find_by(user_id: user_id,
                                 user_caldav: username,
                                 account_type: ICLOUD_ACC_TYPE)
		if account
		begin
			# pass =  Api::Web::Utils.decrypt_rsa(rsa_pass)
			private_key = OpenSSL::PKey::RSA.new(RSA_PRIVATE_KEY.to_s)
			# password = private_key.private_decrypt(Base64.decode64(account.pass_income)).split('@')[0]
			pw = private_key.private_decrypt(Base64.decode64(account.pass_income))
			port = ''
			if account.port_caldav
			port = ':' + account.port_caldav.to_s
			end
			
			server_path_carddav = account.server_path_caldav.to_s.sub! 'calendars', 'carddavhome'
			
			carddav_url = "https://p01-contacts.icloud.com" + port.to_s + server_path_carddav.to_s
			
			#authenticate and create new client
			carddav = {
				:url      => carddav_url,
				:user     => account.user_caldav,
				:icloud_user_id => account.icloud_user_id,
				:password => pw[0, pw.rindex('@')],
				:authtype => 'basic'
			}
			@icloud_carddav = CardDav::ICloudClient.new(
				:uri => carddav[:url], 
				:user => carddav[:user] , 
				:password => carddav[:password],
				:icloud_user_id => carddav[:icloud_user_id], 
				:authtype => carddav[:authtype]
			)
		rescue
		end
		end
	end

	def get_google_object(link_data)
		account = {
			:user => link_data[:user_income],
			:access_token => link_data[:auth_token]
		}
		uid = link_data[:id]
		cal_uri = link_data[:root_id]

		# a lot of 3rd links create in previous version don't have cal_uri
		if cal_uri == ''
			return nil
		end

		# authenticate then return @gcal
		authenticate_with_google_caldav_server(account)
		g_event = @gcal.find_event(cal_uri, uid)
		g_calendar = @gcal.get_g_calendar(cal_uri)

		# format color of google calendar (ex: #1B887AFF)
		if g_calendar["color"].length >= 9
			2.times do g_calendar["color"].chop! end
		end
		# update colort and insert collection name
		if !g_event.nil?
			g_event["calendar_name"] = g_calendar["name"]
			g_event["color"] = g_calendar["color"]
			g_event["calendarcolor"] = g_calendar["color"]
			g_event["tpObjType"] = GOOGLE_ACC_TYPE
			g_event["tpAccount"] = account[:user]
			g_event["isReadOnly"] = g_calendar["is_read_only"]
		end

		g_event
	end

	def get_yahoo_object(link_data)
		data = [] 
		account = {
			:user => link_data[:user_income],
			:pw => link_data[:pass_income]
		}
		uid = link_data[:id]
		cal_uri = link_data[:root_id]

		# a lot of 3rd links create in previous version don't have cal_uri
		if cal_uri == ''
			return nil
		end

		# authenticate then return @ycal
		authenticate_with_yahoo_caldav_server(account)
		# Note: get_y_calendar temporarily reponses the wrong format,
		# so we can not parse the XML to get the calendar data.
		# y_calendar = @ycal.get_y_calendar(cal_uri) 
		cals = @ycal.getlistcalendars
		allCals = []
		if cals
			if !cals[0].nil? && !cals[0][:error].nil?
				allCals = cals
			else
				cals.each{ |cal|
					if cal['uri'].eql?(cal_uri)
						item = { 
							'name': cal['displayname'],
							'href': cal['uri'],
							'color': cal['calendarcolor'],
							'is_read_only': cal['is_rrails sead_only']
						}
						allCals << item
					end
				}
			end
		end
		if allCals.any?
			y_calendar = allCals.first
		end
		
		case link_data[:type]
			when "VEVENT"
				y_event = @ycal.find_event(cal_uri, uid)
				# update color
				if !y_event.nil?
					y_event["color"] = y_calendar["color"]
					y_event["tpObjType"] = YAHOO_ACC_TYPE
					y_event["tpAccount"] = account[:user]
					y_event["calendarcolor"] = y_calendar["color"]
					y_event["isReadOnly"] = y_calendar["is_read_only"]
					data.push(y_event)
				end
			when "VTODO"
				y_todo = @ycal.find_todo(cal_uri, uid)
				# update color
				if !y_todo.nil?
					y_todo["color"] = y_calendar["color"]
					y_todo["tpObjType"] = YAHOO_ACC_TYPE
					y_todo["tpAccount"] = account[:user]
					y_todo["calendarcolor"] = y_calendar["color"]
					y_todo["isReadOnly"] = y_calendar["is_read_only"]
					data.push(y_todo)
				end
		end             
		data
	end

	def get_icloud_object(link_data)
		data = []
		account = {
			:user => link_data[:user_income],
			:pw => link_data[:pass_income]
		}
		uid = link_data[:id]
		cal_uri = link_data[:root_id]

		# a lot of 3rd links create in previous version don't have cal_uri
		if cal_uri == ''
			return nil
		end

		# get icloud calendar
		if link_data[:type] != "VCARD"
			# authenticate CALDAV then return @icloud
			authenticate_with_icloud_caldav_server(account)
			i_calendar = @icloud.get_icloud_calendar(cal_uri)
			# format color of icloud (ex: #63DA38FF)
			if i_calendar["color"].length >= 9
				2.times do i_calendar["color"].chop! end
			end
		else 
			# authenticate CARDDAV then return @icloud_carddav
			authenticate_with_icloud_carddav_server(account)
		end
		
		case link_data[:type]
			when "VEVENT"
				i_event = @icloud.find_event(cal_uri, uid)
				# update color
				if !i_event.nil?
					i_event["color"] = i_calendar["color"]
					i_event["tpObjType"] = ICLOUD_ACC_TYPE
					i_event["tpAccount"] = account[:user]
					i_event["calendarcolor"] = i_calendar["color"]
					i_event["isReadOnly"] = i_calendar["is_read_only"]
					data.push(i_event)
				end
			when "VTODO"
				i_todo = @icloud.find_todo(cal_uri, uid)
				# update color
				if !i_todo.nil?
					i_todo["color"] = i_calendar["color"]
					i_todo["tpObjType"] = ICLOUD_ACC_TYPE
					i_todo["tpAccount"] = account[:user]
					i_todo["calendarcolor"] = i_calendar["color"]
					i_todo["isReadOnly"] = i_calendar["is_read_only"]
					data.push(i_todo)
				end
			when "VCARD"
				i_contact = @icloud_carddav.find_contact(cal_uri, uid)
				if !i_contact.nil?
					i_contact["tpObjType"] = ICLOUD_ACC_TYPE
					i_contact["tpAccount"] = account[:user]
					i_contact["itemType"] = "VCARD"
					data.push(i_contact)
				end
		end             
		data
	end

	# def search_cal_object_data(qs, cal_uri)
	# 	authenticate_with_sabre_caldav_server(nil)
	# 	@cal.searchcalendars(qs, cal_uri)
	# end
end
