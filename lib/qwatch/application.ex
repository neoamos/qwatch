defmodule Qwatch.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  def start(_type, _args) do
    # List all child processes to be supervised
    children = [
      # Start the Ecto repository
      Qwatch.Repo,
      # Start our room server supervisor
      Qwatch.Rooms.RoomSupervisor,
      # Start the endpoint when the application starts
      QwatchWeb.Endpoint,
      # Starts a worker by calling: Qwatch.Worker.start_link(arg)
      # {Qwatch.Worker, arg},
      {Registry, keys: :unique, name: Registry.RoomRegistry},
      #Start Presence tracker
      Qwatch.Presence,
    ]

    :ets.new(:users_online_count, [:set, :public, :named_table])

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Qwatch.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    QwatchWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
