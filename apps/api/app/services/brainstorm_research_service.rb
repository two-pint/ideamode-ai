# frozen_string_literal: true

class BrainstormResearchService
  RESEARCH_PROMPTS = {
    "market_lookup" => "You are a market researcher. Search the web and provide a brief overview of products, services, or trends in the given space. Return a JSON object with: \"summary\" (string, 2-4 paragraphs), \"links\" (array of objects with \"url\" and \"title\"), and \"key_takeaways\" (array of strings, 3-7 bullet points).",
    "competitor_spot" => "You are a competitive intelligence researcher. Search the web for direct or indirect competitors for the given concept. Return a JSON object with: \"summary\" (string, 1-2 paragraphs), \"competitors\" (array of objects with \"name\", \"url\", \"one_liner\"), and \"key_takeaways\" (array of strings).",
    "trend_signal" => "You are a trend analyst. Search the web for demand signals, interest, or momentum around the given topic. Return a JSON object with: \"summary\" (string, 2-4 paragraphs with caveats where appropriate), \"links\" (array of objects with \"url\" and \"title\"), and \"key_takeaways\" (array of strings)."
  }.freeze

  def initialize(api_key: nil)
    @api_key = api_key || ENV["ANTHROPIC_API_KEY"]
    @client = @api_key ? Anthropic::Client.new(api_key: @api_key) : nil
  end

  def run(research_type:, query:)
    return { "error" => "API not configured" } unless @client

    prompt = RESEARCH_PROMPTS[research_type]
    return { "error" => "Unknown research type" } unless prompt

    user_content = "Query: #{query}\n\nRespond with only a single JSON object (no markdown, no code block). Keys: summary, links (array of {url, title}), key_takeaways (array of strings). For competitor_spot use \"competitors\" (array of {name, url, one_liner}) instead of links."

    response = @client.messages.create(
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: prompt,
      messages: [{ role: "user", content: user_content }],
      tools: [{ type: "web_search_20250305", name: "web_search" }]
    )

    content_blocks = response.content.is_a?(Array) ? response.content : [response.content]
    text = content_blocks.map do |c|
      next c.text if c.respond_to?(:text)
      c["text"] if c.is_a?(Hash) && c["type"] == "text"
    end.compact.join
    parse_result(text, research_type)
  rescue StandardError => e
    Rails.logger.error("[BrainstormResearchService] #{e.message}")
    { "error" => e.message, "summary" => "", "links" => [], "key_takeaways" => [] }
  end

  private

  def parse_result(text, research_type)
    # Extract JSON from response (may be wrapped in markdown)
    json_str = text.strip
    json_str = json_str.gsub(/\A```(?:json)?\s*/, "").gsub(/\s*```\z/, "") if json_str.include?("```")
    data = JSON.parse(json_str)
    {
      "summary" => data["summary"].to_s,
      "links" => Array(data["links"]).map { |l| { "url" => l["url"].to_s, "title" => l["title"].to_s } },
      "competitors" => Array(data["competitors"]).map { |c| { "name" => c["name"].to_s, "url" => c["url"].to_s, "one_liner" => c["one_liner"].to_s } },
      "key_takeaways" => Array(data["key_takeaways"]).map(&:to_s)
    }
  rescue JSON::ParserError
    { "summary" => text.presence || "Could not parse response.", "links" => [], "competitors" => [], "key_takeaways" => [] }
  end
end
