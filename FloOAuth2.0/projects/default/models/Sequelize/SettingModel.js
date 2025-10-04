const config = {
  tableName: 'setting',
  model: 'SettingModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        require: true
      },
      default_cal: {
        type: DataTypes.STRING,
        default: '',
        require: true
      },
      timezone: {
        type: DataTypes.STRING,
        default: 'America/Chicago',
        require: true
      },
      tz_city: DataTypes.STRING,
      working_time: {
        type: DataTypes.STRING,
        default: '',
        require: true
      },
      event_duration: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      alert_default: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      snooze_default: {
        type: DataTypes.INTEGER,
        default: 15,
        require: true
      },
      timezone_support: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      task_duration: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      deadline: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      due_task: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      number_stask: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      total_duration: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      buffer_time: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },

      hide_stask: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      background: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      short_duration: {
        type: DataTypes.INTEGER,
        default: 30,
        require: true
      },
      medium_duration: {
        type: DataTypes.INTEGER,
        default: 60,
        require: true
      },
      long_duration: {
        type: DataTypes.INTEGER,
        default: 180,
        require: true
      },
      default_folder: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },

      calendar_color: {
        type: DataTypes.STRING,
        default: '',
        require: true
      },
      folder_color: {
        type: DataTypes.STRING,
        default: '',
        require: true
      },
      navbar_system: {
        type: DataTypes.STRING,
        require: true,
        allowNull: false,
        default: null
      },
      navbar_custom: {
        type: DataTypes.STRING,
        require: true
      },
      infobox: {
        type: DataTypes.STRING,
        require: true
      },
      infobox_order: {
        type: DataTypes.JSON,
        require: true
      },

      contact_display_name: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      contact_display_inlist: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      m_ade: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      m_event: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      m_task: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      m_stask: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      m_done_task: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      m_due_task: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      m_note: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      dw_due_task: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      dw_ade: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      dw_done_task: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      dw_note: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      del_warning: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      hide_future_task: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      ics_attachment: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      mail_auto_download_check: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      mail_num_time_dont_auto_download: {
        type: DataTypes.INTEGER,
        default: 6,
        require: true
      },
      mail_time_dont_auto_download: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      mail_display_act_button: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      number_mail_lines_preview: {
        type: DataTypes.INTEGER,
        default: 4,
        require: true
      },
      mail_moving_check: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      mail_size_dont_download: {
        type: DataTypes.INTEGER,
        default: 10,
        require: true
      },
      show_nutshell: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      show_bg_by_weather: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      week_start: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      send_and_track: {
        type: DataTypes.INTEGER,
        default: 2,
        require: true
      },
      action_icon: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },

      emailbox_order: {
        type: DataTypes.JSON,
        require: true
      },

      alert_before: {
        type: DataTypes.INTEGER,
        default: 60,
        require: true
      },
      send_invite: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },

      from_email: {
        type: DataTypes.STRING,
        default: '',
        require: true
      },

      default_alert_ade: {
        type: DataTypes.INTEGER,
        default: 0
      },
      default_alert_todo: {
        type: DataTypes.INTEGER,
        default: 0
      },
      default_milestone_alert: {
        type: DataTypes.INTEGER,
        default: 0
      },
      avatar: {
        type: DataTypes.STRING,
        require: true
      },

      assign_tz_eve: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      m_show: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      dw_show: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      agenda_show: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      move_email: {
        type: DataTypes.INTEGER,
        default: 1,
        require: true
      },
      noti_bear_track: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      state: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      recent_tz: {
        type: DataTypes.STRING,
        default: null
      },
      order_url: {
        type: DataTypes.STRING,
        default: null
      },
      order_todo: {
        type: DataTypes.STRING,
        default: null
      },
      keep_state: {
        type: DataTypes.STRING,
        default: null
      },
      omni_cal_id: {
        type: DataTypes.STRING,
        default: ''
      },
      url_option: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      init_planner_st: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      order_storyboard: {
        type: DataTypes.STRING,
        default: null
      },
      show_star: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      signature: {
        type: DataTypes.STRING,
        require: true
      },
      filing_email: {
        type: DataTypes.INTEGER,
        default: 0
      },
      show_date_timezone: {
        type: DataTypes.INTEGER,
        default: 0
      },
      show_feedback: {
        type: DataTypes.INTEGER,
        default: 1
      },
      theme_mode: {
        type: DataTypes.INTEGER,
        require: true,
        default: 0
      },
      scroll_24h: {
        type: DataTypes.INTEGER,
        require: true,
        default: 1
      },
      created_date: {
        type: DataTypes.DOUBLE(13, 3),
        require: true
      },
      updated_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      }

    }, config);
  }
};

module.exports = Model;
