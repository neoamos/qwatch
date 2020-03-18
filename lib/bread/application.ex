defmodule Bread.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  def start(_type, _args) do
    # List all child processes to be supervised
    children = [
      # Start the Ecto repository
      Bread.Repo,
      # Start our room server supervisor
      Bread.Rooms.RoomSupervisor,
      # Start the endpoint when the application starts
      BreadWeb.Endpoint,
      # Starts a worker by calling: Bread.Worker.start_link(arg)
      # {Bread.Worker, arg},
      {Registry, keys: :unique, name: Registry.RoomRegistry},
      #Start Presence tracker
      Bread.Presence,
    ]

    IO.inspect("dsf")

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Bread.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    BreadWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
