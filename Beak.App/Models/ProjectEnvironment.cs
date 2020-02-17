using System.Collections.Generic;
using Beak.Common.Inpc;

namespace Beak.App.Models
{
	public class ProjectEnvironment : BaseViewModel
	{
		public string Name
		{
			get { return _name; }
			set { SetField(ref _name, value); }
		}
		private string _name = string.Empty;

		public Dictionary<string, string> Mapping
		{
			get { return _mapping; }
			set { SetField(ref _mapping, value); }
		}
		private Dictionary<string, string> _mapping = new Dictionary<string, string>();
	}
}
