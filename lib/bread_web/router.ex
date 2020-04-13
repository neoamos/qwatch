defmodule BreadWeb.Router do
  use BreadWeb, :router
  use Coherence.Router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug Coherence.Authentication.Session
  end

  pipeline :protected do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug Coherence.Authentication.Session, protected: true
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", BreadWeb do
    pipe_through :browser

    get "/", IndexController, :index

    get "/rr/:name", RoomController, :room
    get "/r/:name", RoomController, :room_react

    get "/user/:name", UserController, :profile
  end

  scope "/", BreadWeb do
    pipe_through :protected

    get "/room/new", RoomController, :new
    post "/room/create", RoomController, :create
    get "/room/edit/:name", RoomController, :edit_form
    post "/room/edit/", RoomController, :edit

    get "/user_rooms", UserController, :user_rooms
  end

  # Add this block
  scope "/" do
    pipe_through :browser
    coherence_routes()
  end

  # Add this block
  scope "/" do
    pipe_through :protected
    coherence_routes :protected
  end

  # Other scopes may use custom stacks.
  # scope "/api", BreadWeb do
  #   pipe_through :api
  # end
end
