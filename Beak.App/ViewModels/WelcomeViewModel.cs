using System;
using System.Collections.Generic;
using System.Linq;
using Beak.App.Enums;
using Beak.App.Models;

namespace Beak.App.ViewModels
{
	public sealed class WelcomeViewModel : BaseViewModel
	{
		public List<RecentTimeboxedProjects> RecentProjects
		{
			get { return _recentProjects; }
			set{ SetField(ref _recentProjects, value, "RecentProjects"); }
		}
		private List<RecentTimeboxedProjects> _recentProjects = new List<RecentTimeboxedProjects>();

		public void LoadMockData()
		{
			var now = DateTime.Now;
			var files = new List<RecentFile>
			{
				new RecentFile
				{
					Directory = "C:/Users/afr/Api Projects/Branch",
					ProjectName = "Branch app",
					LastModified = now
				},
				new RecentFile
				{
					Directory = "C:/Users/afr/Api Projects/Xbox Live",
					ProjectName = "XBL mappings",
					LastModified = now.Subtract(TimeSpan.FromDays(2))
				},
				new RecentFile
				{
					Directory = "C:/Users/afr/Api Projects/Monzo",
					ProjectName = "Monzo reverse engineering",
					LastModified = now.Subtract(TimeSpan.FromDays(12))
				},
				new RecentFile
				{
					Directory = "C:/Users/afr/Api Projects/Cuvva",
					ProjectName = "Full",
					LastModified = now.Subtract(TimeSpan.FromDays(25))
				},
				new RecentFile
				{
					Directory = "C:/Users/afr/Api Projects/Tinder",
					ProjectName = "Tinder reverse engineering",
					LastModified = now.Subtract(TimeSpan.FromDays(60))
				}
			};

			files.Sort((a, b) => b.LastModified.CompareTo(a.LastModified));

			foreach (var file in files)
			{
				var diffDays = now.Subtract(file.LastModified).TotalDays;
				TimeboxedArea area;

				if (diffDays > 30)
					area = TimeboxedArea.Older;
				else if (diffDays > 7)
					area = TimeboxedArea.ThisMonth;
				else if (diffDays > 1)
					area = TimeboxedArea.ThisWeek;
				else
					area = TimeboxedArea.Today;

				var existingArea = RecentProjects.FirstOrDefault(o => o.Area == area);

				if (existingArea == null)
				{
					RecentProjects.Add(new RecentTimeboxedProjects
					{
						Area = area,
						Projects = new List<RecentFile> { file }
					});
				}
				else
				{
					existingArea.Projects.Add(file);
				}
			}
		}
	}
}
