package org.bbop.termgenie.data;

import java.util.Arrays;

/**
 * This class is required to map the internal representation of fields to an object which
 * can be serialized into JSON.
 */
public class JsonTermTemplate {

	private String name;
	private String display;
	private String description;
	private String hint;
	private JsonTemplateField[] fields;

	public JsonTermTemplate() {
		super();
	}

	/**
	 * @return the name
	 */
	public String getName() {
		return name;
	}

	/**
	 * @param name
	 *            the name to set
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * @return the fields
	 */
	public JsonTemplateField[] getFields() {
		return fields;
	}

	/**
	 * @param fields
	 *            the fields to set
	 */
	public void setFields(JsonTemplateField[] fields) {
		this.fields = fields;
	}
	
	/**
	 * @return the hint
	 */
	public String getHint() {
		return hint;
	}

	/**
	 * @param hint the hint to set
	 */
	public void setHint(String hint) {
		this.hint = hint;
	}

	/**
	 * @return the display
	 */
	public String getDisplay() {
		return display;
	}

	/**
	 * @param display the display to set
	 */
	public void setDisplay(String display) {
		this.display = display;
	}

	/**
	 * @return the description
	 */
	public String getDescription() {
		return description;
	}

	/**
	 * @param description the description to set
	 */
	public void setDescription(String description) {
		this.description = description;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#toString()
	 */
	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("JsonTermTemplate:{");
		if (name != null) {
			builder.append("name:");
			builder.append(name);
			builder.append(", ");
		}
		if (display != null) {
			builder.append("display:");
			builder.append(display);
			builder.append(", ");
		}
		if (description != null) {
			builder.append("description:");
			builder.append(description);
			builder.append(", ");
		}
		if (fields != null) {
			builder.append("fields:");
			builder.append(Arrays.toString(fields));
			builder.append(", ");
		}
		if (hint != null) {
			builder.append("hint:");
			builder.append(hint);
		}
		builder.append("}");
		return builder.toString();
	}

	public static class JsonTemplateField {
		
		private String name;
		private boolean required;
		private JsonCardinality cardinality;
		private String[] functionalPrefixes;
		private String[] ontologies;

		public JsonTemplateField() {
			super();
		}

		/**
		 * @param name
		 * @param required
		 * @param cardinality
		 * @param functionalPrefixes
		 * @param ontology
		 */
		public JsonTemplateField(String name, boolean required, JsonCardinality cardinality,
				String[] functionalPrefixes, String[] ontologies) {
			super();
			this.name = name;
			this.required = required;
			this.cardinality = cardinality;
			this.functionalPrefixes = functionalPrefixes;
			this.ontologies = ontologies;
		}

		/**
		 * @return the name
		 */
		public String getName() {
			return name;
		}

		/**
		 * @param name
		 *            the name to set
		 */
		public void setName(String name) {
			this.name = name;
		}

		/**
		 * @return the required
		 */
		public boolean isRequired() {
			return required;
		}

		/**
		 * @param required
		 *            the required to set
		 */
		public void setRequired(boolean required) {
			this.required = required;
		}

		/**
		 * @return the cardinality
		 */
		public JsonCardinality getCardinality() {
			return cardinality;
		}

		/**
		 * @param cardinality
		 *            the cardinality to set
		 */
		public void setCardinality(JsonCardinality cardinality) {
			this.cardinality = cardinality;
		}

		/**
		 * @return the functionalPrefixes
		 */
		public String[] getFunctionalPrefixes() {
			return functionalPrefixes;
		}

		/**
		 * @param functionalPrefixes
		 *            the functionalPrefixes to set
		 */
		public void setFunctionalPrefixes(String[] functionalPrefixes) {
			this.functionalPrefixes = functionalPrefixes;
		}

		/**
		 * @return the ontologies
		 */
		public String[] getOntologies() {
			return ontologies;
		}

		/**
		 * @param ontologies the ontologies to set
		 */
		public void setOntologies(String[] ontologies) {
			this.ontologies = ontologies;
		}
		
		/* (non-Javadoc)
		 * @see java.lang.Object#toString()
		 */
		@Override
		public String toString() {
			StringBuilder builder = new StringBuilder();
			builder.append("JsonTemplateField:{");
			if (name != null) {
				builder.append("name:");
				builder.append(name);
				builder.append(", ");
			}
			builder.append("required:");
			builder.append(required);
			builder.append(", ");
			if (cardinality != null) {
				builder.append("cardinality:");
				builder.append(cardinality);
				builder.append(", ");
			}
			if (functionalPrefixes != null) {
				builder.append("functionalPrefixes:");
				builder.append(Arrays.toString(functionalPrefixes));
				builder.append(", ");
			}
			if (ontologies != null) {
				builder.append("ontologies:");
				builder.append(Arrays.toString(ontologies));
			}
			builder.append("}");
			return builder.toString();
		}
	}

	public static class JsonCardinality {
		
		private int min;
		private int max;

		public JsonCardinality() {
			super();
		}

		/**
		 * @param min
		 * @param max
		 */
		public JsonCardinality(int min, int max) {
			super();
			this.min = min;
			this.max = max;
		}

		/**
		 * @return the min
		 */
		public int getMin() {
			return min;
		}

		/**
		 * @param min
		 *            the min to set
		 */
		public void setMin(int min) {
			this.min = min;
		}

		/**
		 * @return the max
		 */
		public int getMax() {
			return max;
		}

		/**
		 * @param max
		 *            the max to set
		 */
		public void setMax(int max) {
			this.max = max;
		}
		
		public boolean isUnique() {
			return min == 1 && max == 1;
		}

		/* (non-Javadoc)
		 * @see java.lang.Object#toString()
		 */
		@Override
		public String toString() {
			StringBuilder builder = new StringBuilder();
			builder.append("JsonCardinality:{min:");
			builder.append(min);
			builder.append(", max:");
			builder.append(max);
			builder.append("}");
			return builder.toString();
		}
	}
}
