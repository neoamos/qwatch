defmodule Bread.Chat.ChatMessage do
  use Ecto.Schema
  import Ecto.Changeset

  alias Bread.Rooms.Room
  alias Bread.Accounts.User


  schema "chat_message" do
    field :message, :string
    field :deleted, :boolean

    belongs_to :user, User
    belongs_to :room, Room
    belongs_to :deleted_by, User

    timestamps()
  end

  def changeset(model, params \\ %{}) do
    model
    |> cast(params, [:message, :user_id, :room_id])
    |> validate_required([:message, :user_id, :room_id])
    |> validate_length(:message, max: 255)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:room_id)
  end


end