defmodule Bread.Rooms.Link do
  use Ecto.Schema
  import Ecto.Changeset

  alias Bread.Rooms.Room
  alias Bread.Accounts.User


  schema "link" do
    field :link, :string
    field :title, :string
    field :description, :string
    field :image, :string
    field :site_name, :string
    field :external_image, :string

    belongs_to :user, User
    belongs_to :room, Room

    timestamps()
  end

  def changeset(model, params \\ %{}) do
    model
    |> cast(params, [:link, :title, :description, :site_name, :image, :external_image, :user_id, :room_id])
    |> validate_required([:link, :user_id, :room_id])
    |> validate_length(:title, max: 100)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:room_id)
  end

  def edit_changeset(model, params \\ %{}) do
    model
    |> cast(params, [:title, :description, :image, :external_image, :site_name])
    |> validate_length(:title, max: 100)
  end


end