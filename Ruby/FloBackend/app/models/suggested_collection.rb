class SuggestedCollection < ApplicationRecord
  include CommonScopes

  belongs_to :project
  belongs_to :user
  has_many :identical_senders, dependent: :delete_all

  after_initialize :created_time, if: :new_record?
  before_save :update_time, if: :persisted?

  scope :by_criterion, lambda { |criterion_type, criterion_value|
    return none if criterion_value.blank?
    where(criterion_type: criterion_type, criterion_value: criterion_value)
  }

  scope :by_email, lambda {
    includes(:project, :identical_senders).where(criterion_type: Criterion::EMAIL_TYPE)
  }

  scope :by_file, lambda {
    where(criterion_type: Criterion::FILE_TYPE)
  }

  scope :by_url, lambda {
    where(criterion_type: Criterion::URL_TYPE)
  }

  scope :by_todo, lambda {
    where(criterion_type: Criterion::TODO_TITLE)
  }

  scope :by_note, lambda {
    where(criterion_type: Criterion::NOTE_TITLE)
  }

  scope :by_note_title, lambda { |title|
    by_criterion(Criterion::NOTE_TITLE, title)
  }

  scope :by_todo_title, lambda { |title|
    by_criterion(Criterion::TODO_TITLE, title)
  }

  scope :by_event, lambda {
    table = SuggestedCollection.arel_table
    event_title = table[:criterion_type].eq Criterion::EVENT_TITLE
    event_location = table[:criterion_type].eq Criterion::EVENT_LOCATION
    event_invitee = table[:criterion_type].eq Criterion::EVENT_INVITEE
    where(event_location.or(event_title).or(event_invitee))
  }

  scope :by_contact, lambda {
    table = SuggestedCollection.arel_table
    contact_company = table[:criterion_type].eq Criterion::CONTACT_COMPANY
    contact_domain = table[:criterion_type].eq Criterion::CONTACT_DOMAIN
    contact_name = table[:criterion_type].eq Criterion::CONTACT_NAME
    where(contact_company.or(contact_domain).or(contact_name))
  }

  scope :by_contact_company, lambda { |company_name|
    by_criterion(Criterion::CONTACT_COMPANY, company_name)
  }

  scope :by_contact_domain, lambda { |domain|
    by_criterion(Criterion::CONTACT_DOMAIN, domain)
  }

  scope :by_email_subject, lambda { |subject|
    by_criterion(Criterion::EMAIL_TYPE, subject)
  }

  private

  def created_time
    self.created_date = Time.now.utc.to_f.round(3)
    self.updated_date = Time.now.utc.to_f.round(3)
  end

  def update_time
    self.updated_date = Time.now.utc.to_f.round(3)
  end
end
