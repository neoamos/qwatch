defmodule Qwatch.Repo.Migrations.Coherence do
  use Ecto.Migration

  def change do
    create table(:user) do
      add :name,         :string, size: 24, null: false
      add :email,        :string, size: 64, null: false
      add :gender,       :integer
      add :city,         :string, size: 64
      add :birthday,     :date
      add :bio,          :text
      add :pm_message,   :text
      add :hobbies,      :text
      add :message_count,:integer, default: 0
      add :views,        :integer, default: 0
      add :last_access,  :utc_datetime
      add :profile_image, :string, default: "noavatar.jpg"
      add :api_key, :string, size: 15
      add :last_access_ip, :string
      add :banned, :boolean

      # rememberable
      add :remember_created_at, :utc_datetime
      # authenticatable
      add :password_hash, :string
      # recoverable
      add :reset_password_token, :string
      add :reset_password_sent_at, :utc_datetime
      # lockable
      add :failed_attempts, :integer, default: 0
      add :locked_at, :utc_datetime
      # trackable
      add :sign_in_count, :integer, default: 0
      add :current_sign_in_at, :utc_datetime
      add :last_sign_in_at, :utc_datetime
      add :current_sign_in_ip, :string
      add :last_sign_in_ip, :string
      # unlockable_with_token
      add :unlock_token, :string
      # confirmable
      add :confirmation_token, :string
      add :confirmed_at, :utc_datetime
      add :confirmation_sent_at, :utc_datetime

      timestamps()
    end
    
    create table(:rememberables) do
      add :series_hash, :string
      add :token_hash, :string
      add :token_created_at, :utc_datetime
      add :user_id, references(:user, on_delete: :delete_all)
    
      timestamps
    end
    
    create index(:rememberables, [:user_id])
    create index(:rememberables, [:series_hash])
    create index(:rememberables, [:token_hash])
    create unique_index(:rememberables, [:user_id, :series_hash, :token_hash])
  end
end
