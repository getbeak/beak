using System.Collections.Generic;

namespace Beak.Project.Models
{
	public class ProjectEntry
	{
		public string Id { get; set; }

		public string Name { get; set; }

		public ProjectEntryUrl Url { get; set; }
	}

	public class ProjectEntryUrl
	{
		public string MethodVerb { get; set; }

		public string Protocol { get; set; }

		public string Host { get; set; }

		public string Uri { get; set; }

		public Dictionary<string, string> UriParameters { get; set; }
	}
}
