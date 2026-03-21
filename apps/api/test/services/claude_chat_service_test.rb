# frozen_string_literal: true

require "test_helper"

class ClaudeChatServiceTest < ActiveSupport::TestCase
  test "stream_chat yields a configuration hint when API key is missing" do
    chunks = []
    ClaudeChatService.new(api_key: nil).stream_chat(
      system_prompt: "You are helpful.",
      messages: [{ "role" => "user", "content" => "Hello", "user_id" => 1 }]
    ) { |c| chunks << c }

    assert_equal 1, chunks.size
    assert_includes chunks.first, "ANTHROPIC_API_KEY"
  end
end
