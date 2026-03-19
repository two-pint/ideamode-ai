# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_18_100008) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "brainstorm_invites", force: :cascade do |t|
    t.datetime "accepted_at", precision: nil
    t.bigint "brainstorm_id", null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", precision: nil, null: false
    t.bigint "invited_by_id", null: false
    t.string "role", default: "collaborator", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.index ["brainstorm_id"], name: "index_brainstorm_invites_on_brainstorm_id"
    t.index ["invited_by_id"], name: "index_brainstorm_invites_on_invited_by_id"
    t.index ["token"], name: "index_brainstorm_invites_on_token", unique: true
  end

  create_table "brainstorm_members", force: :cascade do |t|
    t.datetime "accepted_at", precision: nil
    t.bigint "brainstorm_id", null: false
    t.datetime "created_at", null: false
    t.bigint "invited_by_id", null: false
    t.string "role", default: "collaborator", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["brainstorm_id", "user_id"], name: "index_brainstorm_members_on_brainstorm_id_and_user_id", unique: true
    t.index ["brainstorm_id"], name: "index_brainstorm_members_on_brainstorm_id"
    t.index ["invited_by_id"], name: "index_brainstorm_members_on_invited_by_id"
    t.index ["user_id"], name: "index_brainstorm_members_on_user_id"
  end

  create_table "brainstorm_notes", force: :cascade do |t|
    t.bigint "brainstorm_id", null: false
    t.jsonb "content", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["brainstorm_id"], name: "index_brainstorm_notes_on_brainstorm_id", unique: true
    t.index ["user_id"], name: "index_brainstorm_notes_on_user_id"
  end

  create_table "brainstorm_research", force: :cascade do |t|
    t.bigint "brainstorm_id", null: false
    t.datetime "created_at", null: false
    t.string "query", null: false
    t.string "research_type", null: false
    t.jsonb "result", default: {}, null: false
    t.datetime "updated_at", null: false
    t.index ["brainstorm_id", "created_at"], name: "index_brainstorm_research_on_brainstorm_id_and_created_at"
    t.index ["brainstorm_id"], name: "index_brainstorm_research_on_brainstorm_id"
  end

  create_table "brainstorm_resources", force: :cascade do |t|
    t.bigint "brainstorm_id", null: false
    t.datetime "created_at", null: false
    t.text "notes"
    t.string "resource_type", default: "url", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["brainstorm_id"], name: "index_brainstorm_resources_on_brainstorm_id"
  end

  create_table "brainstorms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.text "pinned_message_content"
    t.string "pinned_message_id"
    t.string "slug", null: false
    t.string "status", default: "exploring", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "visibility", default: "private", null: false
    t.index ["user_id", "slug"], name: "index_brainstorms_on_user_id_and_slug", unique: true
    t.index ["user_id"], name: "index_brainstorms_on_user_id"
  end

  create_table "chat_sessions", force: :cascade do |t|
    t.datetime "archived_at"
    t.bigint "brainstorm_id"
    t.datetime "created_at", null: false
    t.bigint "idea_id"
    t.jsonb "messages", default: [], null: false
    t.datetime "updated_at", null: false
    t.index ["brainstorm_id"], name: "index_chat_sessions_on_brainstorm_id", unique: true, where: "(brainstorm_id IS NOT NULL)"
    t.index ["idea_id", "archived_at"], name: "index_chat_sessions_on_idea_id_and_archived_at", where: "(idea_id IS NOT NULL)"
    t.index ["idea_id"], name: "index_chat_sessions_on_idea_id_active", unique: true, where: "((idea_id IS NOT NULL) AND (archived_at IS NULL))"
    t.check_constraint "brainstorm_id IS NOT NULL AND idea_id IS NULL OR brainstorm_id IS NULL AND idea_id IS NOT NULL", name: "chat_sessions_exactly_one_scope"
  end

  create_table "idea_analyses", force: :cascade do |t|
    t.string "analysis_type", null: false
    t.jsonb "annotations", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "idea_id", null: false
    t.jsonb "result", default: {}, null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["idea_id", "created_at"], name: "index_idea_analyses_on_idea_id_and_created_at", order: { created_at: :desc }
    t.index ["idea_id"], name: "index_idea_analyses_on_idea_id"
  end

  create_table "idea_invites", force: :cascade do |t|
    t.datetime "accepted_at", precision: nil
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", precision: nil, null: false
    t.bigint "idea_id", null: false
    t.bigint "invited_by_id", null: false
    t.string "role", default: "collaborator", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.index ["idea_id"], name: "index_idea_invites_on_idea_id"
    t.index ["invited_by_id"], name: "index_idea_invites_on_invited_by_id"
    t.index ["token"], name: "index_idea_invites_on_token", unique: true
  end

  create_table "idea_members", force: :cascade do |t|
    t.datetime "accepted_at", precision: nil
    t.datetime "created_at", null: false
    t.bigint "idea_id", null: false
    t.bigint "invited_by_id", null: false
    t.string "role", default: "collaborator", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["idea_id", "user_id"], name: "index_idea_members_on_idea_id_and_user_id", unique: true
    t.index ["idea_id"], name: "index_idea_members_on_idea_id"
    t.index ["invited_by_id"], name: "index_idea_members_on_invited_by_id"
    t.index ["user_id"], name: "index_idea_members_on_user_id"
  end

  create_table "idea_notes", force: :cascade do |t|
    t.jsonb "content", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "idea_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["idea_id"], name: "index_idea_notes_on_idea_id", unique: true
    t.index ["user_id"], name: "index_idea_notes_on_user_id"
  end

  create_table "idea_prds", force: :cascade do |t|
    t.text "content", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "generated_at"
    t.bigint "idea_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "version", default: 1, null: false
    t.index ["idea_id", "version"], name: "index_idea_prds_on_idea_id_and_version", unique: true
    t.index ["idea_id"], name: "index_idea_prds_on_idea_id"
    t.index ["user_id"], name: "index_idea_prds_on_user_id"
  end

  create_table "idea_tasks", force: :cascade do |t|
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.date "due_date"
    t.bigint "idea_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["idea_id", "created_at"], name: "index_idea_tasks_on_idea_id_and_created_at"
    t.index ["idea_id"], name: "index_idea_tasks_on_idea_id"
    t.index ["user_id"], name: "index_idea_tasks_on_user_id"
  end

  create_table "idea_wireframes", force: :cascade do |t|
    t.jsonb "canvas_data", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "idea_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["idea_id", "created_at"], name: "index_idea_wireframes_on_idea_id_and_created_at"
    t.index ["idea_id"], name: "index_idea_wireframes_on_idea_id"
    t.index ["user_id"], name: "index_idea_wireframes_on_user_id"
  end

  create_table "ideas", force: :cascade do |t|
    t.bigint "brainstorm_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.text "pinned_message_content"
    t.string "pinned_message_id"
    t.string "slug", null: false
    t.string "status", default: "validating", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "visibility", default: "private", null: false
    t.index ["brainstorm_id"], name: "index_ideas_on_brainstorm_id"
    t.index ["user_id", "slug"], name: "index_ideas_on_user_id_and_slug", unique: true
    t.index ["user_id"], name: "index_ideas_on_user_id"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.text "bio"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "google_uid"
    t.string "name"
    t.string "password_digest"
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["google_uid"], name: "index_users_on_google_uid", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "brainstorm_invites", "brainstorms"
  add_foreign_key "brainstorm_invites", "users", column: "invited_by_id"
  add_foreign_key "brainstorm_members", "brainstorms"
  add_foreign_key "brainstorm_members", "users"
  add_foreign_key "brainstorm_members", "users", column: "invited_by_id"
  add_foreign_key "brainstorm_notes", "brainstorms"
  add_foreign_key "brainstorm_notes", "users"
  add_foreign_key "brainstorm_research", "brainstorms"
  add_foreign_key "brainstorm_resources", "brainstorms"
  add_foreign_key "brainstorms", "users"
  add_foreign_key "chat_sessions", "brainstorms"
  add_foreign_key "chat_sessions", "ideas"
  add_foreign_key "idea_analyses", "ideas"
  add_foreign_key "idea_invites", "ideas"
  add_foreign_key "idea_invites", "users", column: "invited_by_id"
  add_foreign_key "idea_members", "ideas"
  add_foreign_key "idea_members", "users"
  add_foreign_key "idea_members", "users", column: "invited_by_id"
  add_foreign_key "idea_notes", "ideas"
  add_foreign_key "idea_notes", "users"
  add_foreign_key "idea_prds", "ideas"
  add_foreign_key "idea_prds", "users"
  add_foreign_key "idea_tasks", "ideas"
  add_foreign_key "idea_tasks", "users"
  add_foreign_key "idea_wireframes", "ideas"
  add_foreign_key "idea_wireframes", "users"
  add_foreign_key "ideas", "brainstorms"
  add_foreign_key "ideas", "users"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
end
