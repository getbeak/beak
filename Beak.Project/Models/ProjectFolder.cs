using System.Collections.Generic;

namespace Beak.Project.Models
{
	public class ProjectFolder
	{
		public List<ProjectEntry> Entries { get; set; } = new List<ProjectEntry>();

		public List<ProjectFolder> Folders { get; set; } = new List<ProjectFolder>();
	}
}
