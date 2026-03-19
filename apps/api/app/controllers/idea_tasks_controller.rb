# frozen_string_literal: true

class IdeaTasksController < ApplicationController
  include Authenticatable
  include IdeaFromRoute

  before_action :require_authentication!
  before_action :set_idea, only: %i[index create update destroy]
  before_action :set_task, only: %i[update destroy]
  before_action :require_editable!, only: %i[create update destroy]

  def index
    tasks = @idea.idea_tasks.order(created_at: :asc)
    render json: { tasks: tasks.map { |t| task_json(t) } }
  end

  def create
    task = @idea.idea_tasks.create!(
      user_id: current_user.id,
      title: params[:title].to_s.strip.presence || "Untitled task",
      completed: false,
      due_date: params[:due_date].presence
    )
    render json: { task: task_json(task) }, status: :created
  end

  def update
    @task.update!(task_update_params)
    render json: { task: task_json(@task) }
  end

  def destroy
    @task.destroy!
    head :no_content
  end

  private

  def set_task
    @task = @idea.idea_tasks.find(params[:id])
  end

  def task_update_params
    p = {}
    p[:title] = params[:title] if params.key?(:title)
    p[:completed] = params[:completed] if params.key?(:completed)
    p[:due_date] = (params[:due_date].presence || nil) if params.key?(:due_date)
    p
  end

  def task_json(t)
    {
      id: t.id,
      idea_id: t.idea_id,
      title: t.title,
      completed: t.completed,
      due_date: t.due_date&.iso8601,
      created_at: t.created_at,
      updated_at: t.updated_at
    }
  end
end
