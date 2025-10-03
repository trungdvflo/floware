require 'rubygems'
require 'vpim'

  # class String
    # alias_method :each, :each_line
  # end
#    
  class VcardParser
    attr_accessor :full_name, :last_name, :first_name, :title, :organisation, :email, :phones, :url, :address, :note,
                  :fax_phone, :home_phone, :mobile_phone, :office_phone
   
    def initialize(vcard)
      scrub_vcf(vcard)
      parse(Vpim::Vcard.decode(vcard.join('')).first)
    end
   
    def scrub_vcf(line_arr)
      line_arr.delete_if { |line| line.chomp.match(/^.+\:.+$/).nil? }
      line_arr.join
    end
   
    def parse(vcard)
      @phones = []
      begin
        vcard.each do |card|
          case card.name
            when 'FN'
              @full_name = card.value
            when 'N'
              _temp = card.value.split(';')
              @last_name = _temp.reverse!.pop
              @first_name = _temp.reverse!.join(' ')
            when 'CN'
              _temp = card.value.split(' ')
              @last_name = _temp.reverse!.pop
              @first_name = _temp.reverse!.join(' ')
            when 'FIRSTNAME'
              @first_name = card.value
            when 'LASTNAME'
              @last_name = card.value
            when 'EMAIL', 'MAIL', 'mail'
              @email = card.value
            when 'ORG', 'COMPANY'
              @organisation = card.value
            when 'TEL', 'TELEPHONENUMBER'
              case card.pvalue("TYPE")
                when 'Work', 'WORK'
                  @office_phone = card.value
                when 'Home', 'HOME'
                  @home_phone = card.value
                when 'Fax', 'FAX'
                  @fax_phone = card.value
                when 'CELL', 'MOBILE'
                  @mobile_phone = card.value
                else
                  @phones << card.value
              end
            when 'title', 'TITLE'
              @title = card.value
            else
              Rails.logger.info "Currently Not Required Field #{card.name} - #{card.value}"
          end
        end
      rescue => e
        raise "An error occurred while trying to parse the vcf file. (#{e.message})"
      end
    end
   
  end