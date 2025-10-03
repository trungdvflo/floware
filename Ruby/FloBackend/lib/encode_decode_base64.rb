#!/bin/env ruby
# encoding: utf-8

require "base64"
require "json"

module EncodeDecodeBase64
  # if type is email use
  # convert string from ascii to utf-8
  # refer to: https://sosedoff.com/2012/02/18/emoji-and-rails.html
  def self.process_string_b64_from_ascii_to_utf8(str_b64)
    # decode base64
    # unable to search this link after creating
    begin

      decoded = Base64.strict_decode64(str_b64)
      decoded = decoded.force_encoding("utf-8")

      obj = JSON.parse(decoded.to_s)
      res = {:uid => obj['uid'], :path => obj['path'], :title => obj['title'].force_encoding("utf-8")}

      #endcode base64
      str = res.to_json.to_s
      s = Base64.strict_encode64(str)

      # Uncomment because puts above error when drag to kanban
      return s

    rescue
      return str_b64
    end

  end
end