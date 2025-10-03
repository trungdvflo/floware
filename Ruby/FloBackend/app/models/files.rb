class Files < ApplicationRecord
  self.table_name = "files"
  self.primary_key = "id"

  after_initialize :defaults, if: :new_record?
  attr_accessor :ref

  before_create :set_create_time
  before_update :set_update_time

  validates :source, numericality: { only_integer: true }, inclusion: { in: [0, 1] }
  validates :obj_type, inclusion: { in: ['VEVENT', 'VTODO',
                                         'VJOURNAL', 'VCALENDAR', 'FOLDER', 'LINK', 'URL',
                                         'TRACK', 'FILE', 'TRASH', 'KANBAN', 'EMAIL', 'CANVAS',
                                         'HISTORY', 'VCARD', 'ORDER_OBJ', 'SET_3RD_ACC',
                                         'SUGGESTED_COLLECTION', 'CSFILE'] }
  validates :uid, presence: true, uniqueness: { scope: [:user_id] }

  #sum total file size
  def self.get_total_size_file(user_id)
    sql = " SELECT SUM(f.size) AS total FROM files f "
    sql << " WHERE f.user_id = :user_id"
    find_by_sql([sql, { user_id: user_id }])
  end

  def self.get_total_size_file_by_email(email)
    sql = " SELECT SUM(f.size) AS total FROM files f, users u"
    sql << " WHERE u.id = f.user_id AND u.username = :email"
    find_by_sql([sql, { email: email }])
  end

  def self.str_ids(strIds)
    res = ''
    if strIds and strIds.length > 0
      arr = strIds.split(',')
      if arr and arr.length > 0
        arr.each do |id|
          res = res + "'" + id.to_s.strip + "'" + ',' if id.to_s.strip != ''
        end
        res = res.to_s.chop
      end
    end
    return res
  end

  #delete files by uid
  def self.delete_files_byUID(user_id, uids)
    where(user_id: user_id, uid: uids.split(',')).delete_all
  end

  #delete files by client id
  def self.delete_files_byClientID(user_id, client_ids)
    where(user_id: user_id, client_id: client_ids.split(',')).delete_all
  end

  #delete files by object id
  def self.delete_files_byObjID(user_id, obj_ids)
    where(user_id: user_id, obj_id: obj_ids.split(',')).delete_all
  end

  #get fObjs
  def self.get_fObjs(user_id, mod = 0, ids = '')
    if mod.to_i == 1
      where(user_id: user_id, client_id: ids.split(','))
    elsif mod.to_i == 2
      where(user_id: user_id, obj_id: ids.split(','))
    else
      where(user_id: user_id, uid: ids.split(','))
    end
  end

  #delete file on HDD
  def self.delete_files_onHDD(user_id, fObjs)
    if fObjs and fObjs.length > 0
      desPath = UPLOAD_FILE_PATH + user_id.to_s + "/"

      begin
        system("sudo chmod 777 -R #{desPath}")
      rescue
      end


      fObjs.each do |fObj|
        #delete file
        fName = fObj.uid.to_s.strip + fObj.ext.to_s
        fPath = desPath.to_s + fName.to_s
        File.delete(fPath) if File.file?(fPath)
      end
    end
  end

  def self.delete_files_onDB(user_id, mod = 0, ids = '')
    if mod.to_i == 1 #client id
      Files.delete_files_byClientID(user_id, ids)
    elsif mod.to_i == 2 #obj id
      Files.delete_files_byObjID(user_id, ids)
    else #uid
      Files.delete_files_byUID(user_id, ids)
    end
  end

  #delete all item by uids
  #TODO: remove
  def self.delete_files(user_id, uids, is_obj_id)
    sql = " DELETE f FROM files f "
    sql << " WHERE user_id = "
    sql << user_id.to_s
    #delete file by object id
    sql << (is_obj_id and (is_obj_id.to_i == 1)) ? " AND obj_id IN (" : " AND uid IN ("

    sql << uids.to_s
    sql <<  ") "
    connection.execute(sql)
  end

  def self.delete_files_hdd(user_id, uids, is_obj_id)
    #delete file by object id
    fObjs = []
    if is_obj_id.to_i == 1
      fObjs = where(obj_id: uids.split(','))
    else
      fObjs = where(uid: uids.split(','))
    end
    if fObjs and fObjs.length > 0
      desPath = UPLOAD_FILE_PATH + user_id.to_s + "/"
      fObjs.each do |fObj|
        #delete file
        fName = fObj.uid.to_s.strip + fObj.ext.to_s
        fPath = desPath.to_s + fName.to_s
        File.delete(fPath)
      end
    end
  end

  #delete all files by userID >> just for terminate account
  def self.delete_files_by_userID(user_id)
    fObjs = where(user_id: user_id)
    if fObjs and fObjs.length > 0
      desPath = UPLOAD_FILE_PATH + user_id.to_s + "/"
      fObjs.each do |fObj|
        begin
          #delete file
          fName = fObj.uid.to_s.strip + fObj.ext.to_s
          fPath = desPath.to_s + fName.to_s
          File.delete(fPath)
          #delete file in DB
          fObj.destroy()
        rescue
        end
      end #loop
    end #if
  end

  private

  def defaults
    self.url ||= ""
  end

  def set_create_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def set_update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
