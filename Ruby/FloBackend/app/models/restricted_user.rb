class RestrictedUser < ApplicationRecord
  EQUAL = 0
  CONTAIN = 1

  def self.restricted?(username)
    return true if where(name: username.downcase, type_matcher: EQUAL).first
    where(type_matcher: CONTAIN).each do |word|
      return true if username.downcase.include?(word[:name].downcase)
    end
    false
  end
end
