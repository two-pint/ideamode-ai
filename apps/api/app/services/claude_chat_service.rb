# frozen_string_literal: true

class ClaudeChatService
  IDEABOT_TRIGGER = "@ideabot"

  def self.ideabot_trigger?(content)
    content.to_s.include?(IDEABOT_TRIGGER)
  end

  def initialize(api_key: nil)
    @api_key = api_key || ENV["ANTHROPIC_API_KEY"]
    @client = @api_key ? Anthropic::Client.new(api_key: @api_key) : nil
  end

  def stream_chat(system_prompt:, messages:, &block)
    unless @client
      msg = "[Ideabot is not configured: set ANTHROPIC_API_KEY in apps/api/.env and restart the API server.]"
      Rails.logger.warn("[ClaudeChatService] #{msg}")
      block&.call(msg)
      return
    end

    api_messages = messages.map do |m|
      { role: m["role"] == "assistant" ? "assistant" : "user", content: m["content"].to_s }
    end

    stream = @client.messages.stream(
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system_: system_prompt,
      messages: api_messages
    )

    stream.text.each { |chunk| block&.call(chunk) }
  rescue StandardError => e
    Rails.logger.error("[ClaudeChatService] #{e.class}: #{e.message}")
    block&.call("\n\n[Sorry, I encountered an error. Please try again.]")
  end
end
