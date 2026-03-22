# frozen_string_literal: true

ENV["RAILS_ENV"] ||= "test"
ENV["JWT_SECRET"] ||= "test-jwt-secret-for-unit-tests"

require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: :number_of_processors) if ENV["CI"].present?

    def create_user(attrs = {})
      User.create!({
        email: "user-#{SecureRandom.hex(4)}@example.com",
        password: "password123",
        username: "user#{SecureRandom.hex(3)}"
      }.merge(attrs))
    end

    def create_brainstorm(user:, **attrs)
      Brainstorm.create!({
        user: user,
        title: "Test Brainstorm #{SecureRandom.hex(2)}",
        slug: "test-bs-#{SecureRandom.hex(2)}"
      }.merge(attrs))
    end

    def create_idea(user:, **attrs)
      Idea.create!({
        user: user,
        title: "Test Idea #{SecureRandom.hex(2)}",
        slug: "test-idea-#{SecureRandom.hex(2)}"
      }.merge(attrs))
    end
  end
end
