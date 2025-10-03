class Api::MonitorsController < ApplicationController
  def database_timeout
    time_exec = time { User.where("created_date < ? ", Time.now.to_i).first }
    if time_exec.real.to_i < 1
      render json: {}, status: 200
    else
      render json: {}, status: 500
    end
  rescue
    render json: {}, status: 500
  end

  def time(&block)
    Benchmark.measure(&block)
  end
end