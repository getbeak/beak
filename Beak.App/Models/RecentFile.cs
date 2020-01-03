using System;
using System.Collections.Generic;
using Beak.App.Enums;

namespace Beak.App.Models
{
	public class RecentFile
	{
		public string Directory { get; set; }

		public string ProjectName { get; set; }

		public DateTime LastModified { get; set; }
	}

	public class RecentTimeboxedProjects
	{
		public TimeboxedArea Area { get; set; }

		public List<RecentFile> Projects { get; set; }
	}
}
