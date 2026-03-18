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

ActiveRecord::Schema[8.1].define(version: 2026_03_18_000005) do
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
    t.bigint "brainstorm_id"
    t.datetime "created_at", null: false
    t.bigint "idea_id"
    t.jsonb "messages", default: [], null: false
    t.datetime "updated_at", null: false
    t.index ["brainstorm_id"], name: "index_chat_sessions_on_brainstorm_id", unique: true, where: "(brainstorm_id IS NOT NULL)"
    t.index ["idea_id"], name: "index_chat_sessions_on_idea_id", unique: true, where: "(idea_id IS NOT NULL)"
    t.check_constraint "brainstorm_id IS NOT NULL AND idea_id IS NULL OR brainstorm_id IS NULL AND idea_id IS NOT NULL", name: "chat_sessions_exactly_one_scope"
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

  create_table "ideas", force: :cascade do |t|
    t.bigint "brainstorm_id"
    t.datetime "created_at", null: false
    t.text "description"
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
  add_foreign_key "idea_invites", "ideas"
  add_foreign_key "idea_invites", "users", column: "invited_by_id"
  add_foreign_key "idea_members", "ideas"
  add_foreign_key "idea_members", "users"
  add_foreign_key "idea_members", "users", column: "invited_by_id"
  add_foreign_key "ideas", "brainstorms"
  add_foreign_key "ideas", "users"
end
