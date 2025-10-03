json.total @count
json.per_page @paginator[:per_page]
json.page @paginator[:page]

json.data @groups do |group|
  json.group do
    json.extract! group, :id, :name, :number_users, :description
  end
end
