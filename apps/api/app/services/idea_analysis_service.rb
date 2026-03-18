# frozen_string_literal: true

class IdeaAnalysisService
  def initialize(api_key: nil)
    @api_key = api_key || ENV["ANTHROPIC_API_KEY"]
    @client = @api_key ? Anthropic::Client.new(api_key: @api_key) : nil
  end

  def run(idea:, analysis_type:)
    return { "error" => "API not configured" } unless @client

    context = build_context(idea)
    case analysis_type
    when "competitor" then run_competitor(idea, context)
    when "tam" then run_tam(idea, context)
    when "pmf" then run_pmf(idea, context)
    when "full" then run_full(idea, context)
    else { "error" => "Unknown analysis type" }
    end
  end

  private

  def build_context(idea)
    parts = ["Idea: #{idea.title}"]
    parts << "Description: #{idea.description}" if idea.description.present?

    if idea.brainstorm_id.present?
      brainstorm = idea.brainstorm
      parts << "\n--- Prior research from linked brainstorm \"#{brainstorm.title}\" ---"
      brainstorm.brainstorm_research.order(created_at: :desc).limit(5).each do |r|
        parts << "\n#{r.research_type}: #{r.result.to_json.truncate(500)}"
      end
      note = brainstorm.brainstorm_note
      if note&.content.present?
        note_text = tiptap_to_plain(note.content)
        parts << "\nBrainstorm notes: #{note_text.truncate(1000)}" if note_text.present?
      end
    end
    parts.join("\n")
  end

  def tiptap_to_plain(content)
    return "" if content.blank?
    return content.to_s if content.is_a?(String)
    return "" unless content.is_a?(Hash)
    nodes = content["content"]
    return "" unless nodes.is_a?(Array)
    nodes.map { |n| n["text"] || (n["content"] ? tiptap_to_plain({ "content" => n["content"] }) : "") }.join(" ")
  end

  def web_search_tool
    [{ type: "web_search_20250305", name: "web_search" }]
  end

  def run_competitor(idea, context)
    prompt = <<~PROMPT
      You are a competitive analyst. Using web search, analyze the competitive landscape for this idea.
      Context:
      #{context}

      Return a single JSON object with exactly these keys (no markdown, no code block):
      - competitor_analysis.summary (string, 2-4 paragraphs)
      - competitor_analysis.competitors (array of objects: name, strengths array, weaknesses array, pricing string)
      - competitor_analysis.saturation_score (number 1-10)
      - competitor_analysis.whitespace (string, opportunity summary)
    PROMPT
    response = call_claude(prompt)
    parse_and_wrap(response, "competitor_analysis")
  end

  def run_tam(idea, context)
    prompt = <<~PROMPT
      You are a market sizing analyst. Using web search, estimate addressable market for this idea.
      Context:
      #{context}

      Return a single JSON object with exactly these keys (no markdown, no code block):
      - market_size.tam_estimate (string, e.g. "$4.2B")
      - market_size.sam_estimate (string, e.g. "$380M")
      - market_size.confidence (string: "low" | "medium" | "high")
      - market_size.proxies_used (array of strings describing data used)
    PROMPT
    response = call_claude(prompt)
    parse_and_wrap(response, "market_size")
  end

  def run_pmf(idea, context)
    prompt = <<~PROMPT
      You are a product-market fit analyst. Using web search, assess PMF signals for this idea.
      Context:
      #{context}

      Return a single JSON object with exactly these keys (no markdown, no code block):
      - pmf_signals.demand_evidence (string)
      - pmf_signals.pain_point_strength (string: "low" | "medium" | "high")
      - pmf_signals.willingness_to_pay_signals (string)
    PROMPT
    response = call_claude(prompt)
    parse_and_wrap(response, "pmf_signals")
  end

  def run_full(idea, context)
    comp = run_competitor(idea, context)
    tam  = run_tam(idea, context)
    pmf  = run_pmf(idea, context)
    return comp if comp["error"]
    return tam if tam["error"]
    return pmf if pmf["error"]

    verdict = run_verdict(idea, context, comp, tam, pmf)
    {
      "competitor_analysis" => comp["competitor_analysis"] || {},
      "market_size" => tam["market_size"] || {},
      "pmf_signals" => pmf["pmf_signals"] || {},
      "verdict" => verdict
    }
  end

  def run_verdict(idea, context, comp, tam, pmf)
    prompt = <<~PROMPT
      You are an investment-style reviewer. Given these analysis results, produce a verdict.
      Context: #{context}
      Competitor: #{comp.to_json.truncate(800)}
      Market size: #{tam.to_json.truncate(400)}
      PMF: #{pmf.to_json.truncate(400)}

      Return a single JSON object (no markdown, no code block):
      - verdict.score (number 0-100)
      - verdict.recommendation (string: e.g. "Proceed", "Proceed with Caution", "Reconsider")
      - verdict.key_risks (array of strings)
      - verdict.next_steps (array of strings)
    PROMPT
    response = call_claude(prompt)
    parsed = parse_json(response)
    parsed.is_a?(Hash) && parsed["verdict"] ? parsed["verdict"] : { "score" => 50, "recommendation" => "Needs more research", "key_risks" => [], "next_steps" => [] }
  end

  def call_claude(prompt)
    response = @client.messages.create(
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: "Respond with only valid JSON. No markdown, no code fences, no extra text.",
      messages: [{ role: "user", content: prompt }],
      tools: web_search_tool
    )
    content_blocks = response.content.is_a?(Array) ? response.content : [response.content]
    content_blocks.map do |c|
      next c.text if c.respond_to?(:text)
      c["text"] if c.is_a?(Hash) && c["type"] == "text"
    end.compact.join
  end

  def parse_and_wrap(text, top_key)
    data = parse_json(text)
    return { "error" => text.presence || "Parse failed" } unless data.is_a?(Hash)
    value = data[top_key] || data
    value = { top_key => value } unless value.key?(top_key) || data.key?(top_key)
    data.key?(top_key) ? { top_key => data[top_key] } : value
  end

  def parse_json(text)
    json_str = text.to_s.strip
    json_str = json_str.gsub(/\A```(?:json)?\s*/, "").gsub(/\s*```\z/, "") if json_str.include?("```")
    JSON.parse(json_str)
  rescue JSON::ParserError
    nil
  end
end
