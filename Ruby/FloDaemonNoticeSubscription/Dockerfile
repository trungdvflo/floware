FROM ruby:2.3.1-alpine

WORKDIR /var/www/app

RUN apk update \
&& apk add --no-cache mariadb-dev \
build-base \
mysql-client

COPY Gemfile ./

RUN bundle install

COPY . .
CMD ["/usr/local/bin/ruby", "DaemonNoticeSubs.rb"]