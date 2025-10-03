class ChangeCalendars
  NAMESPACE = 'change_calendars:'

  class << self
    def set(key, value)
      $redis.set("#{NAMESPACE}#{key}", value)
      expire(key)
    end

    def get(key)
      $redis.get("#{NAMESPACE}#{key}")
    end

    def delete(key)
      return false unless exist?(key)
      $redis.del("#{NAMESPACE}#{key}")
      true
    end

    def exist?(key)
      $redis.exists("#{NAMESPACE}#{key}")
    end

    private
    def expire(key)
      $redis.expire("#{NAMESPACE}#{key}", 4.hour)
    end
  end
end