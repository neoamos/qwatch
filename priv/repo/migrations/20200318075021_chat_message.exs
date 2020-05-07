defmodule Qwatch.Repo.Migrations.ChatMessage do
  use Ecto.Migration

  def change do
    create table(:chat_message) do
      add :message, :string, null: false, size: 255
      add :deleted, :boolean, default: false
  
      add :user_id, references(:user, on_delete: :delete_all)
      add :room_id, references(:room, on_delete: :delete_all)
      add :deleted_by_id, references(:user, on_delete: :nilify_all)
  
      timestamps()
    end
  end
end
