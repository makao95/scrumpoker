use Mix.Config

# Configure your database
config :scrumpoker, ScrumPoker.Repo,
  username: "postgres",
  password: "postgres",
  database: "scrumpoker_test",
  hostname: "localhost"

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :scrumpoker, ScrumPokerWeb.Endpoint,
  http: [port: 4002],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn
