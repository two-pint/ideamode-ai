# frozen_string_literal: true

# Seed database from YAML fixtures in db/fixtures/.
# Idempotent: re-running replaces data for fixture users with the same structure.
#
# Run with: bin/rails db:seed

FIXTURES_DIR = Rails.root.join("db", "fixtures")

def load_fixture(name)
  path = FIXTURES_DIR.join("#{name}.yml")
  raise "Fixture not found: #{path}" unless File.file?(path)

  YAML.load_file(path) || {}
end

def seed_users
  data = load_fixture("users")
  data.each do |_key, attrs|
    h = attrs.stringify_keys
    user = User.find_by(email: h["email"])
    password = h.delete("password")
    user_attrs = h.slice("email", "username", "name")
    if user
      user.update!(user_attrs.merge(password: password, password_confirmation: password))
    else
      User.create!(user_attrs.merge(password: password, password_confirmation: password))
    end
  end
end

def seed_brainstorms
  data = load_fixture("brainstorms")
  fixture_usernames = data.values.map { |a| a["owner_username"] }.uniq
  User.where(username: fixture_usernames).find_each do |user|
    user.ideas.destroy_all
    user.brainstorms.destroy_all
  end
  data.each do |_key, attrs|
    h = attrs.stringify_keys
    owner_username = h.delete("owner_username")
    user = User.find_by!(username: owner_username)
    user.brainstorms.create!(
      h.slice("title", "description", "slug", "status", "visibility")
    )
  end
end

def seed_ideas
  data = load_fixture("ideas")
  data.each do |_key, attrs|
    h = attrs.stringify_keys
    owner_username = h.delete("owner_username")
    brainstorm_slug = h.delete("brainstorm_slug")
    user = User.find_by!(username: owner_username)
    brainstorm_id = nil
    if brainstorm_slug.present?
      brainstorm = user.brainstorms.find_by(slug: brainstorm_slug)
      brainstorm_id = brainstorm&.id
    end
    user.ideas.create!(
      h.slice("title", "description", "slug", "status", "visibility").merge("brainstorm_id" => brainstorm_id)
    )
  end
end

puts "Seeding from db/fixtures..."

seed_users
seed_brainstorms
seed_ideas

puts "Done. Loaded users.yml, brainstorms.yml, ideas.yml."
