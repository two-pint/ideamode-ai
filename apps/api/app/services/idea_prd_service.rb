# frozen_string_literal: true

class IdeaPrdService
  PRD_SECTIONS = %w[
    Overview
    Problem
    Target_Users
    Goals_and_Success_Metrics
    Key_Features
    Non_Goals
    Open_Questions
    Appendix
  ].freeze

  def initialize(api_key: nil)
    @api_key = api_key || ENV["ANTHROPIC_API_KEY"]
    @client = @api_key ? Anthropic::Client.new(api_key: @api_key) : nil
  end

  def build_context(idea)
    parts = []
    parts << "Idea: #{idea.title}"
    parts << "Description: #{idea.description}" if idea.description.present?

    sessions = idea.chat_sessions.order(created_at: :desc).limit(10)
    if sessions.any?
      parts << "\n\n--- Idea discussion sessions ---"
      sessions.each do |session|
        next if session.messages.blank?
        parts << "\nSession (archived: #{session.archived_at.present?}):"
        session.messages.each do |m|
          role_label = m["role"] == "assistant" ? "Assistant" : "User"
          parts << "\n#{role_label}: #{m['content'].to_s.truncate(1000)}"
        end
      end
    end

    analyses = idea.idea_analyses.where(status: "completed").order(created_at: :desc).limit(5)
    if analyses.any?
      parts << "\n\n--- Idea analyses ---"
      analyses.each do |a|
        parts << "\n#{a.analysis_type}: #{a.result.to_json.truncate(800)}"
      end
    end

    note = idea.idea_note
    if note&.content.present?
      note_text = tiptap_to_plain(note.content)
      parts << "\n\n--- Idea notes ---\n#{note_text.truncate(3000)}" if note_text.present?
    end

    if idea.brainstorm_id.present?
      brainstorm = idea.brainstorm
      parts << "\n\n--- Linked brainstorm: \"#{brainstorm.title}\" ---"

      bs_session = brainstorm.chat_session
      if bs_session&.messages&.any?
        parts << "\n\nBrainstorm chat history:"
        bs_session.messages.each do |m|
          role_label = m["role"] == "assistant" ? "Ideabot" : "User"
          parts << "\n#{role_label}: #{m['content'].to_s.truncate(800)}"
        end
      end

      bs_note = brainstorm.brainstorm_note
      if bs_note&.content.present?
        bs_note_text = tiptap_to_plain(bs_note.content)
        parts << "\n\nBrainstorm notes: #{bs_note_text.truncate(2000)}" if bs_note_text.present?
      end

      brainstorm.brainstorm_research.order(created_at: :desc).limit(5).each do |r|
        parts << "\nResearch (#{r.research_type}): #{r.result.to_json.truncate(500)}"
      end
    end

    parts.join("\n")
  end

  def stream_prd(idea:, &block)
    return unless @client

    context = build_context(idea)
    section_list = PRD_SECTIONS.join(", ")

    system_prompt = <<~PROMPT
      You are a product manager writing a Product Requirements Document (PRD). Generate a PRD in Markdown using only the following sections: #{section_list}.
      For each section, use the context provided below. If there is insufficient context to write a section, output exactly "[Needs input]" for that section — do not invent or hallucinate content.
      Write in clear, concise Markdown. Use ## for section headers. Be specific where the context allows; use [Needs input] only when the context truly does not support the section.
    PROMPT

    user_message = "Context:\n\n#{context}\n\nGenerate the full PRD now."

    stream = @client.messages.stream(
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: system_prompt,
      messages: [ { role: "user", content: user_message } ]
    )

    stream.text.each { |chunk| block.call(chunk) }
  rescue StandardError => e
    Rails.logger.error("[IdeaPrdService] #{e.message}")
    block.call("\n\n[Sorry, PRD generation failed. Please try again.]") if block
  end

  private

  def tiptap_to_plain(content)
    return "" if content.blank?
    return content.to_s if content.is_a?(String)
    return "" unless content.is_a?(Hash)
    nodes = content["content"]
    return "" unless nodes.is_a?(Array)
    nodes.map { |n| n["text"] || (n["content"] ? tiptap_to_plain({ "content" => n["content"] }) : "") }.join(" ")
  end
end
