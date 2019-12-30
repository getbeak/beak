using Microsoft.Extensions.Logging;
using Serilog;
using System.Windows;

namespace Beak.App
{
	/// <summary>
	/// Interaction logic for App.xaml
	/// </summary>
	public partial class App : Application
	{
		public static ILogger<App> Logger { get; private set; }

		protected override void OnStartup(StartupEventArgs e)
		{
			var loggerFactory = new LoggerFactory();
			var loggerConfig = new LoggerConfiguration()
				.WriteTo.Console()
				.WriteTo.File("logs.txt", rollingInterval: RollingInterval.Day)
				.CreateLogger();

			loggerFactory.AddSerilog(loggerConfig);

			Logger = loggerFactory.CreateLogger<App>();

			base.OnStartup(e);
		}
	}
}
