using System.Collections.Generic;
using System.Windows.Controls;
using Beak.App.Models;

namespace Beak.App.Windows.Project
{
	/// <summary>
	/// Interaction logic for EnvironmentViewer.xaml
	/// </summary>
	public partial class EnvironmentViewer : UserControl
	{
		public static ProjectEnvironment[] DesignDataContext = new ProjectEnvironment[]
		{
			new ProjectEnvironment
			{
				Name = "Environment",
				Mapping = new Dictionary<string, string>
				{
					{ "Production", "" },
					{ "Development", "" },
				},
			},
			new ProjectEnvironment
			{
				Name = "Engineer",
				Mapping = new Dictionary<string, string>
				{
					{ "Alex", "" },
					{ "George", "" },
				},
			}
		};

		public EnvironmentViewer()
		{
			InitializeComponent();

			DataContext = EnvironmentViewer.DesignDataContext;
		}
	}
}
